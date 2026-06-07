import { getSupabaseServer } from '@/lib/supabase/server-admin';
import { v4 as uuidv4 } from 'uuid';

export async function generateInvoiceAnalytics(userId: string, period: string = 'month') {
  const supabase = getSupabaseServer();

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('invoice_date, total_amount, payment_status')
    .eq('user_id', userId)
    .order('invoice_date', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[Analytics Service] Error fetching invoices:', error);
    return {};
  }

  const totalInvoices = invoices?.length || 0;
  const paidInvoices = invoices?.filter((i) => i.payment_status === 'paid').length || 0;
  const pendingInvoices = invoices?.filter((i) => i.payment_status === 'pending').length || 0;
  const totalAmount = invoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0;
  const paidAmount = invoices
    ?.filter((i) => i.payment_status === 'paid')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0;
  const pendingAmount = invoices
    ?.filter((i) => i.payment_status === 'pending')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0;

  // Group by date for trends
  const trends: Record<string, { count: number; amount: number }> = {};
  invoices?.forEach((invoice) => {
    const date = invoice.invoice_date || new Date().toISOString().split('T')[0];
    if (!trends[date]) {
      trends[date] = { count: 0, amount: 0 };
    }
    trends[date].count += 1;
    trends[date].amount += invoice.total_amount || 0;
  });

  return {
    totalInvoices,
    paidInvoices,
    pendingInvoices,
    totalAmount,
    paidAmount,
    pendingAmount,
    outstandingAmount: pendingAmount,
    averageInvoiceValue: totalInvoices > 0 ? totalAmount / totalInvoices : 0,
    paymentRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
    trends,
  };
}

export async function generateExpenseAnalytics(userId: string) {
  const supabase = getSupabaseServer();

  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('date, category, total_amount, payment_status')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[Analytics Service] Error fetching expenses:', error);
    return {};
  }

  const totalExpenses = expenses?.reduce((sum, e) => sum + (e.total_amount || 0), 0) || 0;
  const paidExpenses =
    expenses
      ?.filter((e) => e.payment_status === 'paid')
      .reduce((sum, e) => sum + (e.total_amount || 0), 0) || 0;
  const pendingExpenses =
    expenses
      ?.filter((e) => e.payment_status === 'pending')
      .reduce((sum, e) => sum + (e.total_amount || 0), 0) || 0;

  // Group by category
  const byCategory: Record<string, number> = {};
  expenses?.forEach((expense) => {
    const category = expense.category || 'Other';
    byCategory[category] = (byCategory[category] || 0) + (expense.total_amount || 0);
  });

  // Group by date for trends
  const trends: Record<string, number> = {};
  expenses?.forEach((expense) => {
    const date = expense.date || new Date().toISOString().split('T')[0];
    trends[date] = (trends[date] || 0) + (expense.total_amount || 0);
  });

  return {
    totalExpenses,
    paidExpenses,
    pendingExpenses,
    outstandingExpenses: pendingExpenses,
    averageExpense: expenses && expenses.length > 0 ? totalExpenses / expenses.length : 0,
    byCategory,
    trends,
    expenseCount: expenses?.length || 0,
  };
}

export async function generateRevenueAnalytics(userId: string) {
  const supabase = getSupabaseServer();

  const { data: revenue, error } = await supabase
    .from('revenue')
    .select('date, category, total_amount')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[Analytics Service] Error fetching revenue:', error);
    return {};
  }

  const totalRevenue = revenue?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;

  // Group by category
  const byCategory: Record<string, number> = {};
  revenue?.forEach((r) => {
    const category = r.category || 'Other';
    byCategory[category] = (byCategory[category] || 0) + (r.total_amount || 0);
  });

  // Group by date for trends
  const trends: Record<string, number> = {};
  revenue?.forEach((r) => {
    const date = r.date || new Date().toISOString().split('T')[0];
    trends[date] = (trends[date] || 0) + (r.total_amount || 0);
  });

  return {
    totalRevenue,
    averageRevenue: revenue && revenue.length > 0 ? totalRevenue / revenue.length : 0,
    byCategory,
    trends,
    revenueCount: revenue?.length || 0,
  };
}

export async function generateGSTAnalytics(userId: string) {
  const supabase = getSupabaseServer();

  const { data: invoices } = await supabase
    .from('invoices')
    .select('gst_amount, invoice_date')
    .eq('user_id', userId);

  const { data: expenses } = await supabase
    .from('expenses')
    .select('gst_amount, date')
    .eq('user_id', userId);

  const gstCollected = invoices?.reduce((sum, i) => sum + (i.gst_amount || 0), 0) || 0;
  const gstPaid = expenses?.reduce((sum, e) => sum + (e.gst_amount || 0), 0) || 0;
  const gstLiability = Math.max(0, gstCollected - gstPaid);

  return {
    gstCollected,
    gstPaid,
    gstLiability,
    netGST: gstCollected - gstPaid,
    invoicesWithGST: invoices?.filter((i) => i.gst_amount && i.gst_amount > 0).length || 0,
    expensesWithGST: expenses?.filter((e) => e.gst_amount && e.gst_amount > 0).length || 0,
  };
}

export async function generateVendorAnalytics(userId: string) {
  const supabase = getSupabaseServer();

  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('id, name, total_billed, total_paid, outstanding_amount')
    .eq('user_id', userId)
    .order('total_billed', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[Analytics Service] Error fetching vendors:', error);
    return {};
  }

  const totalVendors = vendors?.length || 0;
  const totalBilled = vendors?.reduce((sum, v) => sum + (v.total_billed || 0), 0) || 0;
  const totalPaid = vendors?.reduce((sum, v) => sum + (v.total_paid || 0), 0) || 0;
  const totalOutstanding = vendors?.reduce((sum, v) => sum + (v.outstanding_amount || 0), 0) || 0;

  return {
    totalVendors,
    totalBilled,
    totalPaid,
    totalOutstanding,
    averageVendorBilled: totalVendors > 0 ? totalBilled / totalVendors : 0,
    topVendors: vendors?.slice(0, 10).map((v) => ({
      name: v.name,
      billed: v.total_billed,
      paid: v.total_paid,
      outstanding: v.outstanding_amount,
    })),
  };
}

export async function generateCustomerAnalytics(userId: string) {
  const supabase = getSupabaseServer();

  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, total_invoiced, total_paid, outstanding_amount')
    .eq('user_id', userId)
    .order('total_invoiced', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[Analytics Service] Error fetching customers:', error);
    return {};
  }

  const totalCustomers = customers?.length || 0;
  const totalInvoiced = customers?.reduce((sum, c) => sum + (c.total_invoiced || 0), 0) || 0;
  const totalPaid = customers?.reduce((sum, c) => sum + (c.total_paid || 0), 0) || 0;
  const totalOutstanding = customers?.reduce((sum, c) => sum + (c.outstanding_amount || 0), 0) || 0;

  return {
    totalCustomers,
    totalInvoiced,
    totalPaid,
    totalOutstanding,
    averageCustomerInvoiced: totalCustomers > 0 ? totalInvoiced / totalCustomers : 0,
    topCustomers: customers?.slice(0, 10).map((c) => ({
      name: c.name,
      invoiced: c.total_invoiced,
      paid: c.total_paid,
      outstanding: c.outstanding_amount,
    })),
  };
}
