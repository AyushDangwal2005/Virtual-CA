import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server-admin';
import { calculateFinancialMetrics } from '@/lib/services/accounting.service';
import {
  generateInvoiceAnalytics,
  generateExpenseAnalytics,
  generateGSTAnalytics,
} from '@/lib/services/analytics.service';
import { getIndexData, getFinancialNews, getGSTUpdates } from '@/lib/services/intelligence.service';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    // Get user data
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Get latest metrics
    const { data: latestMetrics } = await supabase
      .from('financial_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('metric_date', { ascending: false })
      .limit(1);

    // Get recent invoices
    const { data: recentInvoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('invoice_date', { ascending: false })
      .limit(5);

    // Get recommendations
    const { data: recommendations } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(3);

    // Calculate fresh metrics
    const metrics = await calculateFinancialMetrics(userId);
    const invoiceAnalytics = await generateInvoiceAnalytics(userId);
    const expenseAnalytics = await generateExpenseAnalytics(userId);
    const gstAnalytics = await generateGSTAnalytics(userId);

    // Get market data
    const nifty = await getIndexData('nifty');
    const sensex = await getIndexData('sensex');

    // Get news
    const gstNews = await getGSTUpdates();

    return NextResponse.json({
      success: true,
      data: {
        user,
        metrics,
        invoiceAnalytics,
        expenseAnalytics,
        gstAnalytics,
        recentInvoices: recentInvoices || [],
        recommendations: recommendations || [],
        marketData: {
          nifty,
          sensex,
        },
        news: gstNews.slice(0, 3),
      },
    });
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
