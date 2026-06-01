// Global application state - computed from actual department data
export interface AppState {
  bookkeeping: {
    entries: Array<{ id: string; date: string; description: string; account: string; debit: number; credit: number }>;
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
    filings: Array<{ name: string; dueDate: string; status: 'completed' | 'pending' | 'overdue'; penalty: number }>;
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

// Initialize empty state
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
    filings: [],
    completionRate: 0,
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

// Storage key
const STORAGE_KEY = 'virtual-ca-app-state';

// Get state from localStorage
export const getAppState = (): AppState => {
  if (typeof window === 'undefined') {
    return createEmptyState();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : createEmptyState();
  } catch (error) {
    console.error('[v0] Failed to load state:', error);
    return createEmptyState();
  }
};

// Save state to localStorage
export const saveAppState = (state: AppState): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[v0] Failed to save state:', error);
  }
};

// Compute dashboard metrics from actual data
export const computeDashboardMetrics = (state: AppState) => {
  const totalRevenue = state.bookkeeping.totalDebit;
  const totalExpenses = state.bookkeeping.totalCredit;
  const taxLiability = state.tax.taxLiability;

  // Calculate audit score based on actual data
  const auditScore =
    state.audit.auditScore === 0
      ? state.audit.transactionCount > 0
        ? Math.min(
            100,
            50 + (state.audit.verifiedCount / Math.max(1, state.audit.transactionCount)) * 50
          )
        : 0
      : state.audit.auditScore;

  const riskLevel =
    state.risk.overallRisk === 0
      ? state.bookkeeping.entries.length === 0
        ? 'No Data'
        : 'Low'
      : state.risk.overallRisk > 70
      ? 'High'
      : state.risk.overallRisk > 40
      ? 'Medium'
      : 'Low';

  return {
    totalRevenue,
    totalExpenses,
    taxLiability,
    auditScore: Math.round(auditScore),
    riskLevel,
  };
};
