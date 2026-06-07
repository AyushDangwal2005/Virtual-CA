import { getSupabaseServer } from '@/lib/supabase/server-admin';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface KnowledgeDocument {
  title: string;
  content: string;
  category: string;
  source?: string;
  referenceUrl?: string;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  source?: string;
  referenceUrl?: string;
  similarity: number;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      throw new Error('HF_TOKEN not configured');
    }

    // Use BGE embeddings via Hugging Face
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/BAAI/bge-small-en-v1.5',
      {
        inputs: text.substring(0, 512), // BGE has 512 token limit
      },
      {
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    // BGE returns array of embeddings, take first one
    if (Array.isArray(response.data) && response.data[0]) {
      return response.data[0];
    }
    throw new Error('Invalid embedding response');
  } catch (error) {
    console.error('[RAG Service] Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

export async function addToKnowledgeBase(
  document: KnowledgeDocument
): Promise<{ id: string; success: boolean }> {
  const supabase = getSupabaseServer();

  try {
    // Generate embedding
    const embedding = await generateEmbedding(document.content);

    // Split content into chunks for better retrieval
    const chunks = chunkContent(document.content, 500);

    const results = [];
    for (const chunk of chunks) {
      const chunkEmbedding = await generateEmbedding(chunk);

      const { error } = await supabase.from('knowledge_base').insert({
        id: uuidv4(),
        title: document.title,
        content: chunk,
        category: document.category,
        source: document.source,
        reference_url: document.referenceUrl,
        embedding: chunkEmbedding,
      });

      if (error) {
        console.error('[RAG Service] Error adding chunk:', error);
      } else {
        results.push({ success: true });
      }
    }

    return {
      id: uuidv4(),
      success: results.length > 0,
    };
  } catch (error) {
    console.error('[RAG Service] Error adding to knowledge base:', error);
    return { id: '', success: false };
  }
}

export async function searchKnowledgeBase(query: string, limit: number = 5): Promise<SearchResult[]> {
  const supabase = getSupabaseServer();

  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Use Supabase pgvector similarity search
    // Note: This uses RPC call or direct SQL
    const { data, error } = await supabase.rpc('search_knowledge_base', {
      query_embedding: queryEmbedding,
      match_limit: limit,
      match_threshold: 0.7,
    });

    if (error) {
      // Fallback: simple text search
      return await fallbackSearch(query, limit);
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      category: item.category,
      source: item.source,
      referenceUrl: item.reference_url,
      similarity: item.similarity || 0,
    }));
  } catch (error) {
    console.error('[RAG Service] Error searching knowledge base:', error);
    return await fallbackSearch(query, limit);
  }
}

async function fallbackSearch(query: string, limit: number): Promise<SearchResult[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .textSearch('content', query)
    .limit(limit);

  if (error) {
    console.error('[RAG Service] Fallback search error:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    category: item.category,
    source: item.source,
    referenceUrl: item.reference_url,
    similarity: 0.5, // Fallback similarity score
  }));
}

export async function initializeKnowledgeBase() {
  const gstDocuments: KnowledgeDocument[] = [
    {
      title: 'GST Basics',
      content:
        'GST (Goods and Services Tax) is a comprehensive, destination-based, consumption tax that has replaced all indirect taxes in India. It is levied at every point of sale or provision of service. The tax collected at each stage is forwarded to the government.',
      category: 'gst_rules',
      source: 'GST Council',
      referenceUrl: 'https://www.gstcouncil.gov.in',
    },
    {
      title: 'GST Rates in India',
      content:
        'GST is levied at four rates: 5%, 12%, 18%, and 28%. Essential items are taxed at 5%, standard goods at 18%, luxury and sin goods at 28%, and specific items at 12%. Some items like food are exempt from GST.',
      category: 'gst_rules',
      source: 'GST Council',
      referenceUrl: 'https://www.gstcouncil.gov.in',
    },
    {
      title: 'GST Registration',
      content:
        'Every person whose aggregate turnover during a financial year exceeds Rs 40 lakhs must register for GST within 30 days of the threshold being crossed. Certain services sectors have a threshold of Rs 20 lakhs.',
      category: 'gst_rules',
      source: 'GST Council',
      referenceUrl: 'https://www.gstcouncil.gov.in',
    },
  ];

  const taxDocuments: KnowledgeDocument[] = [
    {
      title: 'Income Tax Slabs FY 2024-25',
      content:
        'For individuals under the new tax regime: Up to Rs 3,00,000 - Nil, Rs 3,00,001 to Rs 6,00,000 - 5%, Rs 6,00,001 to Rs 9,00,000 - 10%, Rs 9,00,001 to Rs 12,00,000 - 15%, Rs 12,00,001 to Rs 15,00,000 - 20%, Above Rs 15,00,000 - 30%',
      category: 'tax_laws',
      source: 'Income Tax Department',
      referenceUrl: 'https://www.incometaxindia.gov.in',
    },
    {
      title: 'Deductions under Section 80C',
      content:
        'Investments eligible under Section 80C include: Life Insurance Premiums, PPF (Public Provident Fund), ELSS (Equity Linked Savings Scheme), NSC (National Savings Certificate), Home Loan Principal, Tuition Fees, Sukanya Samriddhi Scheme. Maximum deduction is Rs 1,50,000 per financial year.',
      category: 'tax_laws',
      source: 'Income Tax Department',
      referenceUrl: 'https://www.incometaxindia.gov.in',
    },
  ];

  const accountingDocuments: KnowledgeDocument[] = [
    {
      title: 'Double Entry Bookkeeping',
      content:
        'Double entry bookkeeping is a system of accounting where every transaction is recorded in two accounts: one account is debited and another is credited for the same amount. This ensures that the accounting equation (Assets = Liabilities + Equity) always remains balanced.',
      category: 'accounting_standards',
      source: 'ICAI',
      referenceUrl: 'https://www.icai.org',
    },
    {
      title: 'Accounting Standards (Ind-AS)',
      content:
        'Indian Accounting Standards (Ind-AS) are the accounting standards applicable in India. They are generally equivalent to International Financial Reporting Standards (IFRS) and are used for preparation and presentation of financial statements in India.',
      category: 'accounting_standards',
      source: 'ICAI',
      referenceUrl: 'https://www.icai.org',
    },
  ];

  // Add all documents
  const allDocuments = [...gstDocuments, ...taxDocuments, ...accountingDocuments];

  for (const doc of allDocuments) {
    await addToKnowledgeBase(doc);
  }

  console.log('[RAG Service] Knowledge base initialized with', allDocuments.length, 'documents');
}

function chunkContent(content: string, chunkSize: number = 500): string[] {
  const chunks: string[] = [];
  const sentences = content.split(/(?<=[.!?])\s+/);

  let currentChunk = '';
  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).length < chunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk);

  return chunks;
}
