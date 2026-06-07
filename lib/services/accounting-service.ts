import { createClient } from '@/lib/supabase/client';

export interface JournalEntryData {
  date: string;
  description: string;
  account: string;
  debit: number;
  credit: number;
  referenceType?: string;
  referenceId?: string;
}

/**
 * Create journal entry
 */
export async function createJournalEntry(userId: string, entry: JournalEntryData) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('journal_entries')
    .insert([{ ...entry, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all journal entries for a user
 */
export async function getJournalEntries(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Calculate Trial Balance
 */
export async function calculateTrialBalance(userId: string) {
  const entries = await getJournalEntries(userId);

  const accounts: Record<string, { debit: number; credit: number }> = {};

  entries.forEach((entry) => {
    if (!accounts[entry.account]) {
      accounts[entry.account] = { debit: 0, credit: 0 };
    }
    accounts[entry.account].debit += entry.debit;
    accounts[entry.account].credit += entry.credit;
  });

  const balance = {
    totalDebit: 0,
    totalCredit: 0,
    accounts,
  };

  Object.values(accounts).forEach((account) => {
    balance.totalDebit += account.debit;
    balance.totalCredit += account.credit;
  });

  return balance;
}

/**
 * Calculate Profit & Loss Statement
 */
export async function calculateProfitLoss(userId: string, startDate?: string, endDate?: string) {
  const supabase = createClient();

  let query = supabase
    .from('revenue')
    .select('*')
    .eq('user_id', userId);

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data: revenueData, error: revError } = await query;
  if (revError) throw revError;

  let expenseQuery = supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId);

  if (startDate) expenseQuery = expenseQuery.gte('date', startDate);
  if (endDate) expenseQuery = expenseQuery.lte('date', endDate);

  const { data: expenseData, error: expError } = await expenseQuery;
  if (expError) throw expError;

  // Group by category
  const revenue: Record<string, number> = {};
  const expenses: Record<string, number> = {};

  revenueData?.forEach((item) => {
    revenue[item.category] = (revenue[item.category] || 0) + item.total_amount;
  });

  expenseData?.forEach((item) => {
    expenses[item.category] = (expenses[item.category] || 0) + item.total_amount;
  });

  const totalRevenue = Object.values(revenue).reduce((a, b) => a + b, 0);
  const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);

  return {
    revenue,
    totalRevenue,
    expenses,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
    profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
  };
}

/**
 * Calculate Balance Sheet
 */
export async function calculateBalanceSheet(userId: string) {
  const supabase = createClient();

  // Get assets (accounts receivable, cash, etc.)
  const { data: customers } = await supabase
    .from('customers')
    .select('outstanding_amount')
    .eq('user_id', userId);

  const accountsReceivable = customers?.reduce((sum, c) => sum + (c.outstanding_amount || 0), 0) || 0;

  // Get liabilities (accounts payable, tax liability, etc.)
  const { data: vendors } = await supabase
    .from('vendors')
    .select('outstanding_amount')
    .eq('user_id', userId);

  const accountsPayable = vendors?.reduce((sum, v) => sum + (v.outstanding_amount || 0), 0) || 0;

  // Get latest metrics
  const { data: metrics } = await supabase
    .from('financial_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('metric_date', { ascending: false })
    .limit(1)
    .single();

  const assets = {
    cash: metrics?.cash_on_hand || 0,
    accountsReceivable,
    total: (metrics?.cash_on_hand || 0) + accountsReceivable,
  };

  const liabilities = {
    accountsPayable,
    taxLiability: metrics?.tax_liability || 0,
    gstLiability: metrics?.gst_liability || 0,
    total: accountsPayable + (metrics?.tax_liability || 0) + (metrics?.gst_liability || 0),
  };

  const equity = {
    total: assets.total - liabilities.total,
  };

  return {
    assets,
    liabilities,
    equity,
  };
}

/**
 * Calculate Cash Flow Statement
 */
export async function calculateCashFlow(userId: string, startDate?: string, endDate?: string) {
  const supabase = createClient();

  // Operating cash flow from revenue
  let revenueQuery = supabase
    .from('revenue')
    .select('total_amount')
    .eq('user_id', userId);

  if (startDate) revenueQuery = revenueQuery.gte('date', startDate);
  if (endDate) revenueQuery = revenueQuery.lte('date', endDate);

  const { data: revenueData } = await revenueQuery;
  const operatingInflow = revenueData?.reduce((sum, r) => sum + r.total_amount, 0) || 0;

  // Operating cash outflow from expenses
  let expenseQuery = supabase
    .from('expenses')
    .select('total_amount')
    .eq('user_id', userId);

  if (startDate) expenseQuery = expenseQuery.gte('date', startDate);
  if (endDate) expenseQuery = expenseQuery.lte('date', endDate);

  const { data: expenseData } = await expenseQuery;
  const operatingOutflow = expenseData?.reduce((sum, e) => sum + e.total_amount, 0) || 0;

  const operatingCashFlow = operatingInflow - operatingOutflow;

  return {
    operatingCashFlow,
    operatingInflow,
    operatingOutflow,
    investingCashFlow: 0, // To be calculated from investment data
    financingCashFlow: 0, // To be calculated from financing data
    netCashFlow: operatingCashFlow,
  };
}

/**
 * Record expense
 */
export async function recordExpense(userId: string, expense: any) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('expenses')
    .insert([{ ...expense, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Record revenue
 */
export async function recordRevenue(userId: string, revenue: any) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('revenue')
    .insert([{ ...revenue, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get expense breakdown by category
 */
export async function getExpenseBreakdown(userId: string, startDate?: string, endDate?: string) {
  const supabase = createClient();

  let query = supabase
    .from('expenses')
    .select('category, total_amount')
    .eq('user_id', userId);

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;
  if (error) throw error;

  const breakdown: Record<string, number> = {};
  data?.forEach((item) => {
    breakdown[item.category] = (breakdown[item.category] || 0) + item.total_amount;
  });

  return breakdown;
}

/**
 * Get revenue breakdown by category
 */
export async function getRevenueBreakdown(userId: string, startDate?: string, endDate?: string) {
  const supabase = createClient();

  let query = supabase
    .from('revenue')
    .select('category, total_amount')
    .eq('user_id', userId);

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;
  if (error) throw error;

  const breakdown: Record<string, number> = {};
  data?.forEach((item) => {
    breakdown[item.category] = (breakdown[item.category] || 0) + item.total_amount;
  });

  return breakdown;
}

/**
 * Calculate key financial ratios
 */
export async function calculateFinancialRatios(userId: string) {
  const supabase = createClient();

  const { data: metrics } = await supabase
    .from('financial_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('metric_date', { ascending: false })
    .limit(1)
    .single();

  if (!metrics) {
    return {
      currentRatio: 0,
      quickRatio: 0,
      debtToEquityRatio: 0,
      profitMargin: 0,
      roe: 0,
      roa: 0,
    };
  }

  const { data: customers } = await supabase
    .from('customers')
    .select('outstanding_amount')
    .eq('user_id', userId);

  const { data: vendors } = await supabase
    .from('vendors')
    .select('outstanding_amount')
    .eq('user_id', userId);

  const currentAssets = (metrics.cash_on_hand || 0) + (metrics.accounts_receivable || 0);
  const currentLiabilities = (metrics.accounts_payable || 0) + (metrics.gst_liability || 0);
  const totalAssets = currentAssets;
  const totalLiabilities = currentLiabilities + (metrics.tax_liability || 0);
  const equity = totalAssets - totalLiabilities;
  const netIncome = (metrics.total_revenue || 0) - (metrics.total_expenses || 0);

  return {
    currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
    quickRatio: currentLiabilities > 0 ? (currentAssets - (metrics.accounts_receivable || 0)) / currentLiabilities : 0,
    debtToEquityRatio: equity > 0 ? totalLiabilities / equity : 0,
    profitMargin: (metrics.total_revenue || 0) > 0 ? (netIncome / (metrics.total_revenue || 0)) * 100 : 0,
    roe: equity > 0 ? (netIncome / equity) * 100 : 0,
    roa: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
  };
}
