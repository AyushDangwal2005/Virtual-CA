import { embeddingsClient } from '@/lib/api-clients/embeddings-client';
import { llmClient } from '@/lib/api-clients/llm-client';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';
import { AppError } from '@/lib/utils/errors';

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: 'gst' | 'tax' | 'accounting' | 'compliance' | 'case-study' | 'financial';
  source: string;
  embedding?: number[];
  createdAt: Date;
}

export interface RAGResponse {
  answer: string;
  sources: Array<{
    title: string;
    category: string;
    excerpt: string;
    similarity: number;
  }>;
  citations: string[];
}

/**
 * RAG Service - Retrieval Augmented Generation
 * Combines knowledge base search with LLM for cited responses
 */
export class RAGService {
  private readonly SERVICE_NAME = 'RAG_SERVICE';
  private supabase: ReturnType<typeof createClient> | null = null;
  private readonly TOP_K = 5; // Retrieve top 5 relevant documents

  private getSupabase() {
    if (!this.supabase) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        logger.warn(this.SERVICE_NAME, 'Supabase not configured');
        throw new Error('Supabase environment variables not set');
      }
      
      this.supabase = createClient(url, key);
    }
    return this.supabase;
  }

  /**
   * Add document to knowledge base
   */
  async addDocument(doc: Omit<KnowledgeDocument, 'id' | 'createdAt' | 'embedding'>): Promise<string> {
    logger.info(this.SERVICE_NAME, 'Adding document to knowledge base', { title: doc.title });

    try {
      // Generate embedding for the document
      const embedding = await embeddingsClient.embed(doc.content);

      // Store in Supabase
      const supabase = this.getSupabase();
      const { data, error } = await supabase.from('knowledge_base').insert({
        title: doc.title,
        content: doc.content,
        category: doc.category,
        source: doc.source,
        embedding: embedding.vector,
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw new AppError('DB_ERROR', 500, `Failed to add document: ${error.message}`);
      }

      logger.info(this.SERVICE_NAME, 'Document added successfully');
      return data?.[0]?.id || 'unknown';
    } catch (error) {
      logger.error(this.SERVICE_NAME, 'Failed to add document', error);
      throw error;
    }
  }

  /**
   * Search knowledge base for relevant documents
   */
  async search(query: string, limit: number = this.TOP_K): Promise<KnowledgeDocument[]> {
    logger.info(this.SERVICE_NAME, 'Searching knowledge base', { query, limit });

    try {
      // Generate embedding for query
      const queryEmbedding = await embeddingsClient.embed(query);

      // Search in Supabase using pgvector (simulated for now)
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new AppError('DB_ERROR', 500, `Search failed: ${error.message}`);
      }

      // Filter by similarity (in production, use pgvector distance operators)
      const results = (data || [])
        .map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          category: doc.category,
          source: doc.source,
          embedding: doc.embedding,
          createdAt: new Date(doc.created_at),
        }))
        .filter((doc) => this.calculateRelevance(query, doc.content) > 0.3);

      logger.info(this.SERVICE_NAME, 'Search completed', { resultCount: results.length });
      return results.slice(0, limit);
    } catch (error) {
      logger.error(this.SERVICE_NAME, 'Search failed', error);
      return [];
    }
  }

  /**
   * Query with RAG - search knowledge base and generate answer with citations
   */
  async query(question: string): Promise<RAGResponse> {
    logger.info(this.SERVICE_NAME, 'Processing RAG query', { question });

    try {
      // Search for relevant documents
      const relevantDocs = await this.search(question, this.TOP_K);

      if (relevantDocs.length === 0) {
        // If no documents found, use LLM directly
        const answer = await llmClient.complete(`Answer this question: ${question}`);
        return {
          answer,
          sources: [],
          citations: [],
        };
      }

      // Build context from relevant documents
      const context = relevantDocs
        .map((doc, i) => `[Source ${i + 1}] ${doc.title}\n${doc.content.substring(0, 500)}...`)
        .join('\n\n');

      // Generate answer with context
      const prompt = `You are a financial expert. Answer the following question using the provided knowledge base documents.

Question: ${question}

Knowledge Base:
${context}

Answer the question comprehensively, referencing the relevant documents. Cite your sources.`;

      const answer = await llmClient.complete(prompt, { maxTokens: 1024 });

      // Format response with sources
      const sources = relevantDocs.map((doc) => ({
        title: doc.title,
        category: doc.category,
        excerpt: doc.content.substring(0, 200),
        similarity: this.calculateRelevance(question, doc.content),
      }));

      const citations = relevantDocs.map((doc) => doc.source);

      logger.info(this.SERVICE_NAME, 'RAG query completed', { sourceCount: sources.length });

      return {
        answer,
        sources,
        citations: Array.from(new Set(citations)),
      };
    } catch (error) {
      logger.error(this.SERVICE_NAME, 'RAG query failed', error);
      throw error;
    }
  }

  /**
   * Initialize knowledge base with sample documents
   */
  async initializeSampleDocuments(): Promise<void> {
    logger.info(this.SERVICE_NAME, 'Initializing sample documents');

    const sampleDocs: Omit<KnowledgeDocument, 'id' | 'createdAt' | 'embedding'>[] = [
      {
        title: 'GST Registration Requirements',
        content: `GST registration is mandatory for businesses with turnover exceeding Rs. 40 lakhs (Rs. 20 lakhs for special category states). 
        The registration process takes 3-7 days. Required documents include PAN, Aadhaar, address proof, and business registration documents.
        New registration can be done online through the GSTIN portal. Once registered, maintain proper records of all purchases and sales.`,
        category: 'gst',
        source: 'GST Official Guidelines',
      },
      {
        title: 'GST Rate Structure for Services',
        content: `Standard GST rates for services in India:
        - 5% GST: Most basic services, transportation
        - 12% GST: Professional services, repairs
        - 18% GST: Accounting, legal, IT services
        - 28% GST: Luxury services, certain entertainment services
        
        Each rate has specific eligibility criteria and exemptions. Zero-rated services include exports.`,
        category: 'gst',
        source: 'GST Rate Schedule 2024',
      },
      {
        title: 'Invoice Requirements under GST',
        content: `Every invoice must contain:
        1. Invoice number and date
        2. Supplier and recipient GSTIN
        3. Description of goods/services
        4. HSN/SAC code
        5. Quantity and unit price
        6. Tax rate and amount
        7. Total amount including tax
        8. Mode of supply (B2B, B2C, etc.)
        
        Invoices must be issued within 30 days of supply. E-invoicing is mandatory above Rs. 50 crores turnover.`,
        category: 'gst',
        source: 'GST Invoice Rules',
      },
      {
        title: 'Tax Deductions under Section 80C',
        content: `Section 80C allows deductions up to Rs. 1.5 lakh for:
        - Life insurance premiums
        - Provident fund contributions
        - Fixed deposits with banks/post office
        - NSC (National Savings Certificate)
        - ULIP investments
        - Tuition fees for children
        - Home loan principal repayment
        
        This is one of the most popular deductions for individual income tax filing.`,
        category: 'tax',
        source: 'Income Tax Rules 2024',
      },
      {
        title: 'Accounting Standards for SMEs',
        content: `Small and Medium Enterprises must follow Ind-AS Simplified (for turnover < Rs. 250 crores):
        - Maintain books of accounts as per Schedule VI of Companies Act
        - Financial statements include P&L, Balance Sheet, and Cash Flow
        - Depreciation on fixed assets as per Schedule II
        - Valuation of inventory using FIFO or weighted average
        - Provisions for doubtful debts should be made
        
        Audit is mandatory for companies with turnover > Rs. 1 crore.`,
        category: 'accounting',
        source: 'Accounting Standards Handbook',
      },
    ];

    for (const doc of sampleDocs) {
      try {
        await this.addDocument(doc);
      } catch (error) {
        logger.warn(this.SERVICE_NAME, 'Failed to add sample document', { title: doc.title });
      }
    }

    logger.info(this.SERVICE_NAME, 'Sample documents initialization completed');
  }

  private calculateRelevance(query: string, content: string): number {
    // Simple relevance calculation based on keyword overlap
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);

    let matches = 0;
    for (const word of queryWords) {
      if (contentWords.some((w) => w.includes(word) || word.includes(w))) {
        matches++;
      }
    }

    return matches / queryWords.length;
  }
}

export const ragService = new RAGService();
