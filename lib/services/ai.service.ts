import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSupabaseServer } from '@/lib/supabase/server-admin';
import { v4 as uuidv4 } from 'uuid';

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  answer: string;
  sources: Array<{
    title: string;
    category: string;
    referenceUrl?: string;
  }>;
  confidence: number;
}

export async function getAIResponse(
  userId: string,
  question: string,
  context: string,
  conversationHistory?: ConversationMessage[]
): Promise<AIResponse> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build conversation history for context
    const chatHistory = (conversationHistory || []).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Create system prompt for financial advisor
    const systemPrompt = `You are an expert virtual chartered accountant (CA) and financial advisor for Indian businesses. 
You provide accurate, professional guidance on:
- Accounting principles and practices
- GST (Goods and Services Tax) regulations
- Income tax planning and compliance
- Business advisory and financial analysis
- Audit support and compliance management

Always be precise, cite relevant regulations, and provide actionable advice.
Context about the user's financials: ${context}`;

    // Create the prompt with system context
    const fullPrompt = `${systemPrompt}\n\nUser Question: ${question}`;

    const response = await model.generateContent(fullPrompt);
    const answer = response.response.text();

    // Save to chat history
    await saveConversation(userId, question, answer, []);

    return {
      answer,
      sources: [],
      confidence: 0.9,
    };
  } catch (error) {
    console.error('[AI Service] Error getting AI response:', error);
    throw new Error('Failed to get AI response');
  }
}

export async function getGSTGuidance(userId: string, question: string): Promise<AIResponse> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a GST (Goods and Services Tax) expert in India. 
The user has a question about GST. Provide accurate, specific guidance based on current GST laws and regulations.

User Question: ${question}

Provide:
1. Direct answer to the question
2. Relevant GST rule or notification references
3. Practical examples if applicable
4. Any compliance requirements`;

    const response = await model.generateContent(prompt);
    const answer = response.response.text();

    // Extract references from response
    const sources = extractSources(answer, 'gst_rules');

    // Save to chat history
    await saveConversation(userId, question, answer, sources);

    return {
      answer,
      sources,
      confidence: 0.95,
    };
  } catch (error) {
    console.error('[AI Service] Error getting GST guidance:', error);
    throw new Error('Failed to get GST guidance');
  }
}

export async function getTaxPlanning(userId: string, financialData: any): Promise<string[]> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a tax planning expert. Based on the following financial data, provide 3-5 specific tax optimization strategies:

Revenue: ₹${financialData.revenue}
Expenses: ₹${financialData.expenses}
GST Liability: ₹${financialData.gstLiability}
Business Type: ${financialData.businessType}

Provide strategies that are:
1. Compliant with Indian tax laws
2. Practical to implement
3. Quantifiable in terms of potential savings`;

    const response = await model.generateContent(prompt);
    const recommendations = response.response.text();

    // Parse recommendations
    const strategies = recommendations.split('\n').filter((line) => line.trim().length > 0);

    return strategies;
  } catch (error) {
    console.error('[AI Service] Error getting tax planning:', error);
    return [];
  }
}

export async function getFinancialAnalysis(userId: string, statements: any): Promise<string[]> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a financial analyst. Analyze the following financial statements and provide insights:

P&L: Revenue: ₹${statements.revenue}, Expenses: ₹${statements.expenses}, Net Income: ₹${statements.netIncome}
Balance Sheet: Assets: ₹${statements.assets}, Liabilities: ₹${statements.liabilities}, Equity: ₹${statements.equity}

Provide:
1. Key financial ratios and their interpretation
2. Areas of concern or strength
3. Recommendations for improvement
4. Risk assessment`;

    const response = await model.generateContent(prompt);
    const analysis = response.response.text();

    // Split into insights
    const insights = analysis.split('\n').filter((line) => line.trim().length > 0);

    return insights;
  } catch (error) {
    console.error('[AI Service] Error analyzing finances:', error);
    return [];
  }
}

export async function saveConversation(
  userId: string,
  question: string,
  answer: string,
  sources: any[]
) {
  const supabase = getSupabaseServer();

  const { error } = await supabase.from('chat_history').insert({
    id: uuidv4(),
    user_id: userId,
    question,
    answer,
    sources,
    confidence_score: 0.9,
  });

  if (error) {
    console.error('[AI Service] Error saving conversation:', error);
  }
}

export async function getChatHistory(userId: string, limit: number = 50) {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[AI Service] Error fetching chat history:', error);
    return [];
  }

  return data || [];
}

function extractSources(text: string, category: string) {
  const sources: Array<{ title: string; category: string; referenceUrl?: string }> = [];

  // Look for common GST references
  const gstMatches = text.match(/GST (?:Rule|Notice|Law|Act|Section)[\s\w]*/g) || [];
  gstMatches.forEach((match) => {
    sources.push({
      title: match,
      category,
    });
  });

  // Look for section references
  const sectionMatches = text.match(/(?:Section|Rule|Article) \d+[\s\w]*/g) || [];
  sectionMatches.forEach((match) => {
    sources.push({
      title: match,
      category,
    });
  });

  // Remove duplicates
  return Array.from(new Map(sources.map((item) => [item.title, item])).values());
}
