import { NextRequest, NextResponse } from 'next/server';
import {
  generateInvoiceAnalytics,
  generateExpenseAnalytics,
  generateRevenueAnalytics,
  generateGSTAnalytics,
  generateVendorAnalytics,
  generateCustomerAnalytics,
} from '@/lib/services/analytics.service';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const analytics: Record<string, any> = {};

    if (type === 'all' || type === 'invoices') {
      analytics.invoices = await generateInvoiceAnalytics(userId);
    }
    if (type === 'all' || type === 'expenses') {
      analytics.expenses = await generateExpenseAnalytics(userId);
    }
    if (type === 'all' || type === 'revenue') {
      analytics.revenue = await generateRevenueAnalytics(userId);
    }
    if (type === 'all' || type === 'gst') {
      analytics.gst = await generateGSTAnalytics(userId);
    }
    if (type === 'all' || type === 'vendors') {
      analytics.vendors = await generateVendorAnalytics(userId);
    }
    if (type === 'all' || type === 'customers') {
      analytics.customers = await generateCustomerAnalytics(userId);
    }

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
