import { createClient } from '@/lib/supabase/client';

export interface AIFinanceQuery {
  question: string;
  context?: {
    userId?: string;
    financialData?: any;
    recentInvoices?: any[];
    recentExpenses?: any[];
  };
}

export interface AIFinanceResponse {
  answer: string;
  sources: Array<{
    title: string;
    category: string;
    referenceUrl?: string;
    excerpt?: string;
  }>;
  confidence: number;
  recommendations?: string[];
  relatedTopics?: string[];
}

/**
 * Ask the AI Finance Assistant a question
 * Uses RAG (Retrieval Augmented Generation) to provide cited responses
 */
export async function askFinanceAssistant(
  query: AIFinanceQuery
): Promise<AIFinanceResponse> {
  const supabase = createClient();

  try {
    // 1. Search knowledge base for relevant documents
    const relevantDocuments = await searchKnowledgeBase(query.question);

    // 2. Prepare context from knowledge base
    const context = relevantDocuments
      .slice(0, 5)
      .map((doc) => `${doc.category}: ${doc.content}`)
      .join('\n---\n');

    // 3. Call AI API with context
    const aiResponse = await callAIEngine({
      question: query.question,
      context,
      financialData: query.context?.financialData,
    });

    // 4. Save to chat history
    if (query.context?.userId) {
      await addChatHistory(query.context.userId, {
        question: query.question,
        answer: aiResponse.answer,
        sources: relevantDocuments.map((doc) => ({
          title: doc.title,
          category: doc.category,
          reference_url: doc.reference_url,
        })),
        confidence_score: aiResponse.confidence,
      });
    }

    return aiResponse;
  } catch (error) {
    console.error('AI Finance Assistant error:', error);
    return {
      answer: 'I encountered an issue processing your question. Please try again.',
      sources: [],
      confidence: 0,
    };
  }
}

/**
 * Search knowledge base for relevant documents (RAG)
 */
async function searchKnowledgeBase(query: string, limit = 10) {
  const supabase = createClient();

  // For production, use vector similarity search with pgvector
  // For now, use text search
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('id, title, content, category, source, reference_url')
    .or(
      `title.ilike.%${query}%,content.ilike.%${query}%`
    )
    .limit(limit);

  if (error) {
    console.error('Knowledge base search error:', error);
    return [];
  }

  return data || [];
}

/**
 * Call the AI engine (integrate with Qwen/Llama via API)
 */
async function callAIEngine(params: {
  question: string;
  context: string;
  financialData?: any;
}): Promise<AIFinanceResponse> {
  try {
    // In production, call actual LLM API
    // For now, return a mock response
    const mockResponse = generateMockResponse(params.question);
    return mockResponse;
  } catch (error) {
    throw error;
  }
}

/**
 * Generate mock AI response (replace with real LLM call)
 */
function generateMockResponse(question: string): AIFinanceResponse {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes('gst')) {
    return {
      answer: `GST (Goods and Services Tax) is an indirect tax in India. Based on your query, here are the key points:
      
1. GST has multiple tax rates (5%, 12%, 18%, 28%) depending on the goods/services.
2. Registered businesses must file monthly GST returns (GSTR-1, GSTR-3B).
3. GST Input Tax Credit (ITC) is available for registered businesses.
4. Small businesses with annual turnover below ₹40 lakhs can opt for composition scheme.
      
Would you like more specific information about GST compliance or calculations?`,
      sources: [
        {
          title: 'GST Registration and Eligibility',
          category: 'gst_rules',
          referenceUrl: 'https://www.gstcouncil.gov.in',
          excerpt: 'GST is applicable on supply of goods and services...',
        },
        {
          title: 'GST Return Filing Schedule',
          category: 'gst_rules',
          referenceUrl: 'https://www.gstcouncil.gov.in',
          excerpt: 'Monthly GSTR-1 and GSTR-3B filing requirements...',
        },
      ],
      confidence: 0.92,
      recommendations: [
        'Ensure timely GST return filing to avoid penalties',
        'Maintain detailed records of input tax for ITC claims',
        'Monitor GST rate changes applicable to your business',
      ],
      relatedTopics: ['GST Compliance', 'ITC Claims', 'GST Penalties', 'Composition Scheme'],
    };
  }

  if (lowerQuestion.includes('cash flow') || lowerQuestion.includes('liquidity')) {
    return {
      answer: `Cash Flow Management is crucial for business sustainability.

Key Insights:
1. Operating Cash Flow shows actual cash generated from operations
2. Maintain a cash reserve equivalent to 3-6 months of expenses
3. Monitor Accounts Receivable and Payable days
4. Use cash forecasting for planning

Current Status:
- You should analyze your revenue collection period
- Optimize supplier payment terms
- Monitor seasonal variations in cash flow`,
      sources: [
        {
          title: 'Cash Flow Statement Analysis',
          category: 'accounting_standards',
          excerpt: 'Cash flow from operations is the most reliable indicator...',
        },
      ],
      confidence: 0.88,
      recommendations: [
        'Accelerate customer collections',
        'Negotiate better payment terms with suppliers',
        'Maintain adequate cash reserves',
      ],
      relatedTopics: ['Working Capital', 'Liquidity Ratios', 'Cash Forecasting'],
    };
  }

  if (lowerQuestion.includes('tax') || lowerQuestion.includes('deduction')) {
    return {
      answer: `Tax Planning and Deductions for your business:

Available Deductions:
1. Business expenses (office rent, utilities, salaries)
2. Depreciation on fixed assets
3. Interest on business loans
4. Professional fees and consultancy
5. Travel and accommodation for business purposes

Tax Optimization Tips:
- Keep detailed records of all business expenses
- Claim depreciation on applicable assets
- Consider timing of deductible expenses
- Review tax planning strategies before year-end`,
      sources: [
        {
          title: 'Income Tax Deductions for Businesses',
          category: 'tax_laws',
          referenceUrl: 'https://www.incometaxindia.gov.in',
        },
      ],
      confidence: 0.85,
      recommendations: [
        'Maintain comprehensive expense records',
        'Plan major purchases for tax efficiency',
        'Consult CA for optimal structure',
      ],
      relatedTopics: ['Tax Deductions', 'Depreciation', 'Tax Planning', 'Compliance'],
    };
  }

  return {
    answer: `Thank you for your question about financial management. 

General recommendations:
1. Maintain accurate financial records
2. Review financial statements regularly
3. Plan for tax compliance deadlines
4. Monitor cash flow and profitability
5. Seek expert advice for complex scenarios

Please consult with a qualified Chartered Accountant for specific guidance tailored to your business.`,
    sources: [
      {
        title: 'Financial Management Best Practices',
        category: 'accounting_standards',
      },
    ],
    confidence: 0.75,
    recommendations: [
      'Regular financial review',
      'Professional consultation',
      'Compliance maintenance',
    ],
    relatedTopics: ['Financial Analysis', 'Compliance', 'Planning'],
  };
}

/**
 * Add message to chat history
 */
async function addChatHistory(userId: string, message: any) {
  const supabase = createClient();

  const { error } = await supabase
    .from('chat_history')
    .insert([
      {
        user_id: userId,
        ...message,
      },
    ]);

  if (error) {
    console.error('Error saving chat history:', error);
  }
}

/**
 * Get chat history for a user
 */
export async function getChatHistory(userId: string, limit = 50) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Initialize knowledge base with sample data
 */
export async function initializeKnowledgeBase() {
  const supabase = createClient();

  const sampleDocs = [
    {
      title: 'GST Registration and Eligibility',
      content: 'GST registration is mandatory for entities with annual turnover exceeding ₹40 lakhs (₹20 lakhs for specific states). Every registered person must file monthly returns.',
      category: 'gst_rules',
      source: 'GST Council',
      reference_url: 'https://www.gstcouncil.gov.in',
    },
    {
      title: 'Accounting Standards in India',
      content: 'Indian Accounting Standards (Ind-AS) align with IFRS. They ensure consistency in financial reporting and are applicable to certain categories of entities.',
      category: 'accounting_standards',
      source: 'ICAI',
      reference_url: 'https://www.icai.org',
    },
    {
      title: 'Business Income Deductions',
      content: 'All expenses incurred wholly and exclusively for business purposes can be claimed as deductions. This includes rent, salaries, utilities, and professional fees.',
      category: 'tax_laws',
      source: 'Income Tax Department',
      reference_url: 'https://www.incometaxindia.gov.in',
    },
    {
      title: 'Cash Flow Statement Importance',
      content: 'Cash flow statement is critical for assessing liquidity. It shows operating, investing, and financing activities. Unlike profit, cash flow directly impacts business viability.',
      category: 'accounting_standards',
      source: 'Financial Management Guide',
    },
  ];

  for (const doc of sampleDocs) {
    const { error } = await supabase
      .from('knowledge_base')
      .upsert([doc], { onConflict: 'title' });

    if (error) {
      console.error('Error inserting knowledge base doc:', error);
    }
  }
}
