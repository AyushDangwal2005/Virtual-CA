import { NextRequest, NextResponse } from 'next/server';
import { getAIResponse, getGSTGuidance, getTaxPlanning, getChatHistory } from '@/lib/services/ai.service';
import { searchKnowledgeBase, initializeKnowledgeBase } from '@/lib/services/rag.service';
import { getSupabaseServer } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const history = await getChatHistory(userId, limit);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('[AI Chat API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const body = await request.json();
    const { message, category = 'general', useRAG = true } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    let answer = '';
    let sources = [];

    // Get user context for AI
    const supabase = getSupabaseServer();
    const { data: latestMetrics } = await supabase
      .from('financial_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('metric_date', { ascending: false })
      .limit(1);

    const context = latestMetrics?.[0]
      ? `User's latest financial health score: ${latestMetrics[0].health_score}/100, 
         Total Revenue: ₹${latestMetrics[0].total_revenue}, 
         Total Expenses: ₹${latestMetrics[0].total_expenses}`
      : 'No financial data available';

    // Route to appropriate AI service based on category
    if (category === 'gst') {
      const response = await getGSTGuidance(userId, message);
      answer = response.answer;
      sources = response.sources;
    } else if (category === 'tax') {
      // Get financial data for tax planning
      const { data: metrics } = await supabase
        .from('financial_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('metric_date', { ascending: false })
        .limit(1);

      if (metrics && metrics[0]) {
        const strategies = await getTaxPlanning(userId, {
          revenue: metrics[0].total_revenue,
          expenses: metrics[0].total_expenses,
          gstLiability: metrics[0].gst_liability,
          businessType: 'Standard',
        });
        answer = strategies.join('\n');
      } else {
        answer = 'Insufficient financial data for tax planning. Please upload invoices and expenses first.';
      }
    } else {
      // Use RAG for general financial questions
      if (useRAG) {
        const ragResults = await searchKnowledgeBase(message, 5);
        if (ragResults.length > 0) {
          sources = ragResults.map((r) => ({
            title: r.title,
            category: r.category,
            referenceUrl: r.referenceUrl,
          }));
        }

        // Initialize KB if empty
        if (sources.length === 0) {
          await initializeKnowledgeBase();
          const ragResults2 = await searchKnowledgeBase(message, 5);
          sources = ragResults2.map((r) => ({
            title: r.title,
            category: r.category,
            referenceUrl: r.referenceUrl,
          }));
        }
      }

      const response = await getAIResponse(userId, message, context, []);
      answer = response.answer;
      if (response.sources.length > 0) {
        sources = response.sources;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        answer,
        sources,
        category,
      },
    });
  } catch (error) {
    console.error('[AI Chat API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
