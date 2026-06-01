// Global application state managed via localStorage
export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  account: string;
  debit: number;
  credit: number;
}

export interface ComplianceFiling {
  id: string;
  filing: string;
  deadline: string;
  status: 'completed' | 'pending' | 'overdue';
  penalty?: number;
}

export interface AppState {
  bookkeeping: {
    entries: JournalEntry[];
    totalDebit: number;
    totalCredit: number;
    balance: number;
  };
  tax: {
    grossIncome: number;
    deductions: number;
    taxableIncome: number;
    taxLiability: number;
    gstCollected: number;
    gstPaid: number;
    netGST: number;
    tdsAmount: number;
  };
  compliance: {
    filings: ComplianceFiling[];
    completionRate: number;
  };
  audit: {
    transactionCount: number;
    verifiedCount: number;
    fraudFlags: number;
    auditScore: number;
  };
  risk: {
    cashRisk: { score: number; assessment: string };
    taxRisk: { score: number; assessment: string };
    vendorRisk: { score: number; assessment: string };
    customerRisk: { score: number; assessment: string };
    complianceRisk: { score: number; assessment: string };
    overallRisk: number;
  };
  forecast: {
    baselineRevenue: number;
    growthRate: number;
    scenarios: Array<{
      name: string;
      revenue30d: number;
      revenue90d: number;
      confidence: number;
    }>;
  };
  cfo: {
    cashOnHand: number;
    monthlyBurn: number;
    runwayMonths: number;
    recommendedActions: Array<{ action: string; confidence: number; impact: string }>;
  };
}

export const createEmptyState = (): AppState => ({
  bookkeeping: {
    entries: [],
    totalDebit: 0,
    totalCredit: 0,
    balance: 0,
  },
  tax: {
    grossIncome: 0,
    deductions: 0,
    taxableIncome: 0,
    taxLiability: 0,
    gstCollected: 0,
    gstPaid: 0,
    netGST: 0,
    tdsAmount: 0,
  },
  compliance: {
    filings: [
      { id: '1', filing: 'Annual Tax Return (ITR)', deadline: '2026-07-31', status: 'pending' },
      { id: '2', filing: 'Quarterly GST Return', deadline: '2026-06-30', status: 'completed' },
      { id: '3', filing: 'Annual Audit Report', deadline: '2026-08-15', status: 'pending' },
      { id: '4', filing: 'Form 16 Generation', deadline: '2026-06-30', status: 'completed' },
      { id: '5', filing: 'TDS Returns', deadline: '2026-06-10', status: 'overdue', penalty: 5000 },
    ],
    completionRate: 40,
  },
  audit: {
    transactionCount: 0,
    verifiedCount: 0,
    fraudFlags: 0,
    auditScore: 0,
  },
  risk: {
    cashRisk: { score: 0, assessment: '' },
    taxRisk: { score: 0, assessment: '' },
    vendorRisk: { score: 0, assessment: '' },
    customerRisk: { score: 0, assessment: '' },
    complianceRisk: { score: 0, assessment: '' },
    overallRisk: 0,
  },
  forecast: {
    baselineRevenue: 0,
    growthRate: 0,
    scenarios: [],
  },
  cfo: {
    cashOnHand: 0,
    monthlyBurn: 0,
    runwayMonths: 0,
    recommendedActions: [],
  },
});

const STORAGE_KEY = 'virtual-ca-app-state';

/** Load state from localStorage, merging with defaults to handle missing keys */
export const getAppState = (): AppState => {
  if (typeof window === 'undefined') return createEmptyState();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return createEmptyState();
    const parsed = JSON.parse(stored) as Partial<AppState>;
    const defaults = createEmptyState();
    // Deep merge: keep defaults for any missing top-level keys
    return {
      bookkeeping: { ...defaults.bookkeeping, ...parsed.bookkeeping },
      tax: { ...defaults.tax, ...parsed.tax },
      compliance: { ...defaults.compliance, ...parsed.compliance },
      audit: { ...defaults.audit, ...parsed.audit },
      risk: { ...defaults.risk, ...parsed.risk },
      forecast: { ...defaults.forecast, ...parsed.forecast },
      cfo: { ...defaults.cfo, ...parsed.cfo },
    };
  } catch {
    return createEmptyState();
  }
};

/** Persist state to localStorage */
export const saveAppState = (state: AppState): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded or unavailable — fail silently
  }
};

/** Compute dashboard-level KPIs from actual stored data */
export const computeDashboardMetrics = (state: AppState) => {
  const totalRevenue = state.bookkeeping.totalDebit;
  const totalExpenses = state.bookkeeping.totalCredit;
  const taxLiability = state.tax.taxLiability;

  // Audit score: from stored value or computed from entry verification ratio
  const auditScore =
    state.audit.auditScore > 0
      ? state.audit.auditScore
      : state.audit.transactionCount > 0
      ? Math.min(
          100,
          Math.round(
            50 + (state.audit.verifiedCount / state.audit.transactionCount) * 50
          )
        )
      : 0;

  // Risk level: from stored overallRisk or derived from available data
  let riskLevel: string;
  if (state.risk.overallRisk > 0) {
    riskLevel = state.risk.overallRisk > 70 ? 'High' : state.risk.overallRisk > 40 ? 'Medium' : 'Low';
  } else if (state.bookkeeping.entries.length === 0) {
    riskLevel = 'No Data';
  } else {
    // Derive a basic risk from compliance overdue count
    const overdueCount = state.compliance.filings.filter((f) => f.status === 'overdue').length;
    riskLevel = overdueCount > 2 ? 'High' : overdueCount > 0 ? 'Medium' : 'Low';
  }

  // Compliance rate from filings array
  const completionRate =
    state.compliance.filings.length > 0
      ? Math.round(
          (state.compliance.filings.filter((f) => f.status === 'completed').length /
            state.compliance.filings.length) *
            100
        )
      : 0;

  return {
    totalRevenue,
    totalExpenses,
    taxLiability,
    auditScore,
    riskLevel,
    completionRate,
  };
};
