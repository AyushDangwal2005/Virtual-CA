import { getSupabaseServer } from '@/lib/supabase/server-admin';
import { v4 as uuidv4 } from 'uuid';

interface JournalEntry {
  id?: string;
  date: string;
  description: string;
  account: string;
  debit: number;
  credit: number;
  referenceType?: string;
  referenceId?: string;
}

interface FinancialStatements {
  profitAndLoss: ProfitAndLoss;
  balanceSheet: BalanceSheet;
  cashFlow: CashFlow;
}

interface ProfitAndLoss {
  revenue: number;
  expenses: number;
  netIncome: number;
  grossMargin: number;
  netMargin: number;
}

interface BalanceSheet {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

interface CashFlow {
  openingBalance: number;
  inflows: number;
  outflows: number;
  closingBalance: number;
}

export async function createJournalEntry(userId: string, entry: JournalEntry) {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      id: uuidv4(),
      user_id: userId,
      date: entry.date,
      description: entry.description,
      account: entry.account,
      debit: entry.debit || 0,
      credit: entry.credit || 0,
      reference_type: entry.referenceType,
      reference_id: entry.referenceId,
    });

  if (error) {
    console.error('[Accounting Service] Error creating journal entry:', error);
    throw new Error(`Failed to create journal entry: ${error.message}`);
  }

  return data;
}

export async function createInvoiceEntry(
  userId: string,
  invoiceId: string,
  amount: number,
  gstAmount: number
) {
  const today = new Date().toISOString().split('T')[0];

  // Debit Accounts Receivable
  await createJournalEntry(userId, {
    date: today,
    description: `Invoice received - ${invoiceId}`,
    account: 'Accounts Receivable',
    debit: amount + gstAmount,
    credit: 0,
    referenceType: 'invoice',
    referenceId: invoiceId,
  });

  // Credit Sales Revenue
  await createJournalEntry(userId, {
    date: today,
    description: `Sales revenue - ${invoiceId}`,
    account: 'Sales Revenue',
    debit: 0,
    credit: amount,
    referenceType: 'invoice',
    referenceId: invoiceId,
  });

  // Credit GST Payable
  if (gstAmount > 0) {
    await createJournalEntry(userId, {
      date: today,
      description: `GST payable - ${invoiceId}`,
      account: 'GST Payable',
      debit: 0,
      credit: gstAmount,
      referenceType: 'invoice',
      referenceId: invoiceId,
    });
  }
}

export async function createExpenseEntry(
  userId: string,
  vendorId: string,
  amount: number,
  gstAmount: number,
  category: string
) {
  const today = new Date().toISOString().split('T')[0];

  // Debit Expense Account
  await createJournalEntry(userId, {
    date: today,
    description: `Expense - ${category} from vendor ${vendorId}`,
    account: `Expenses - ${category}`,
    debit: amount,
    credit: 0,
    referenceType: 'expense',
    referenceId: vendorId,
  });

  // Debit GST Receivable
  if (gstAmount > 0) {
    await createJournalEntry(userId, {
      date: today,
      description: `GST receivable - ${category}`,
      account: 'GST Receivable',
      debit: gstAmount,
      credit: 0,
      referenceType: 'expense',
      referenceId: vendorId,
    });
  }

  // Credit Accounts Payable
  await createJournalEntry(userId, {
    date: today,
    description: `Accounts payable - ${category}`,
    account: 'Accounts Payable',
    debit: 0,
    credit: amount + gstAmount,
    referenceType: 'expense',
    referenceId: vendorId,
  });
}

export async function getFinancialStatements(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<FinancialStatements> {
  const supabase = getSupabaseServer();

  let query = supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId);

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data: entries, error } = await query;

  if (error) {
    console.error('[Accounting Service] Error fetching journal entries:', error);
    return {
      profitAndLoss: { revenue: 0, expenses: 0, netIncome: 0, grossMargin: 0, netMargin: 0 },
      balanceSheet: { totalAssets: 0, totalLiabilities: 0, totalEquity: 0 },
      cashFlow: { openingBalance: 0, inflows: 0, outflows: 0, closingBalance: 0 },
    };
  }

  return calculateFinancialStatements(entries || []);
}

function calculateFinancialStatements(entries: any[]): FinancialStatements {
  let totalRevenue = 0;
  let totalExpenses = 0;
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;
  let totalInflows = 0;
  let totalOutflows = 0;

  entries.forEach((entry) => {
    const amount = entry.debit || 0;

    // Calculate P&L
    if (entry.account.includes('Revenue') || entry.account.includes('Sales')) {
      totalRevenue += entry.credit || 0;
    } else if (entry.account.includes('Expense')) {
      totalExpenses += entry.debit || 0;
    }

    // Calculate Balance Sheet
    if (
      entry.account.includes('Asset') ||
      entry.account.includes('Receivable') ||
      entry.account.includes('Cash')
    ) {
      totalAssets += entry.debit - (entry.credit || 0);
    } else if (
      entry.account.includes('Liability') ||
      entry.account.includes('Payable') ||
      entry.account.includes('GST')
    ) {
      totalLiabilities += entry.credit - (entry.debit || 0);
    } else if (entry.account.includes('Equity') || entry.account.includes('Capital')) {
      totalEquity += entry.credit - (entry.debit || 0);
    }

    // Calculate Cash Flow
    if (entry.account.includes('Cash') || entry.account.includes('Inflow')) {
      totalInflows += entry.credit || 0;
    }
    if (entry.account.includes('Outflow') || entry.account.includes('Expense')) {
      totalOutflows += entry.debit || 0;
    }
  });

  const netIncome = totalRevenue - totalExpenses;
  const grossMargin = totalRevenue > 0 ? (totalRevenue - totalExpenses) / totalRevenue : 0;
  const netMargin = totalRevenue > 0 ? netIncome / totalRevenue : 0;

  return {
    profitAndLoss: {
      revenue: totalRevenue,
      expenses: totalExpenses,
      netIncome,
      grossMargin,
      netMargin,
    },
    balanceSheet: {
      totalAssets,
      totalLiabilities,
      totalEquity: Math.max(0, totalAssets - totalLiabilities),
    },
    cashFlow: {
      openingBalance: 0,
      inflows: totalInflows,
      outflows: totalOutflows,
      closingBalance: totalInflows - totalOutflows,
    },
  };
}

export async function getTrialBalance(userId: string) {
  const supabase = getSupabaseServer();

  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('account, debit, credit')
    .eq('user_id', userId);

  if (error) {
    console.error('[Accounting Service] Error fetching trial balance:', error);
    return [];
  }

  // Group by account
  const accountMap = new Map<string, { debit: number; credit: number }>();

  (entries || []).forEach((entry) => {
    const existing = accountMap.get(entry.account) || { debit: 0, credit: 0 };
    existing.debit += entry.debit || 0;
    existing.credit += entry.credit || 0;
    accountMap.set(entry.account, existing);
  });

  // Convert to array and calculate balance
  const trialBalance = Array.from(accountMap.entries()).map(([account, { debit, credit }]) => ({
    account,
    debit,
    credit,
    balance: debit - credit,
  }));

  return trialBalance;
}

export async function calculateFinancialMetrics(userId: string) {
  const supabase = getSupabaseServer();
  const today = new Date().toISOString().split('T')[0];

  // Get financial statements
  const statements = await getFinancialStatements(userId);

  // Get receivables and payables
  const { data: receivables } = await supabase
    .from('invoices')
    .select('total_amount')
    .eq('user_id', userId)
    .eq('payment_status', 'pending');

  const { data: payables } = await supabase
    .from('expenses')
    .select('total_amount')
    .eq('user_id', userId)
    .eq('payment_status', 'pending');

  const totalReceivables = (receivables || []).reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalPayables = (payables || []).reduce((sum, exp) => sum + (exp.total_amount || 0), 0);

  // Calculate health score (0-100)
  const profitMargin = statements.profitAndLoss.netMargin * 100;
  const receivablesRatio = statements.profitAndLoss.revenue > 0 
    ? (totalReceivables / statements.profitAndLoss.revenue) * 100
    : 0;
  const payablesRatio = statements.profitAndLoss.expenses > 0
    ? (totalPayables / statements.profitAndLoss.expenses) * 100
    : 0;

  let healthScore = 50; // Base score
  healthScore += Math.min(profitMargin, 30); // Profit margin (max +30)
  healthScore -= Math.min(receivablesRatio / 2, 20); // High receivables is bad (max -20)
  healthScore -= Math.min(payablesRatio / 2, 20); // High payables is bad (max -20)
  healthScore = Math.max(0, Math.min(100, healthScore));

  // Insert metrics
  const { error } = await supabase
    .from('financial_metrics')
    .insert({
      user_id: userId,
      metric_date: today,
      total_revenue: statements.profitAndLoss.revenue,
      total_expenses: statements.profitAndLoss.expenses,
      net_income: statements.profitAndLoss.netIncome,
      accounts_receivable: totalReceivables,
      accounts_payable: totalPayables,
      health_score: Math.round(healthScore),
      risk_level: healthScore > 70 ? 'low' : healthScore > 40 ? 'medium' : 'high',
    });

  if (error) {
    console.error('[Accounting Service] Error saving metrics:', error);
  }

  return {
    healthScore: Math.round(healthScore),
    riskLevel: healthScore > 70 ? 'low' : healthScore > 40 ? 'medium' : 'high',
    statements,
    metrics: {
      totalReceivables,
      totalPayables,
      profitMargin: statements.profitAndLoss.netMargin * 100,
    },
  };
}
