import { createClient } from '@/lib/supabase/client';

export interface HealthScore {
  overall: number; // 0-100
  factors: {
    cashFlow: number;
    profitability: number;
    expenses: number;
    receivables: number;
    compliance: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CFORecommendation {
  id: string;
  category: 'cost_saving' | 'revenue_growth' | 'risk_detection' | 'tax_optimization' | 'compliance';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  estimatedSavings?: number;
  priority: 'low' | 'medium' | 'high';
}

export interface Forecast {
  period: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  confidence: number;
}

/**
 * Calculate financial health score (0-100)
 */
export async function calculateHealthScore(userId: string): Promise<HealthScore> {
  const supabase = createClient();

  // Get latest financial data
  const { data: metrics } = await supabase
    .from('financial_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('metric_date', { ascending: false })
    .limit(1)
    .single();

  if (!metrics) {
    return {
      overall: 0,
      factors: {
        cashFlow: 0,
        profitability: 0,
        expenses: 0,
        receivables: 0,
        compliance: 0,
      },
      trend: 'stable',
      riskLevel: 'high',
    };
  }

  // Calculate individual factors (0-100 each)
  const cashFlowScore = calculateCashFlowScore(metrics);
  const profitabilityScore = calculateProfitabilityScore(metrics);
  const expenseScore = calculateExpenseScore(metrics);
  const receivablesScore = calculateReceivablesScore(metrics);
  const complianceScore = calculateComplianceScore(metrics);

  // Calculate weighted overall score
  const overall = Math.round(
    cashFlowScore * 0.25 +
    profitabilityScore * 0.25 +
    expenseScore * 0.2 +
    receivablesScore * 0.15 +
    complianceScore * 0.15
  );

  // Determine trend (compare with previous period)
  const { data: prevMetrics } = await supabase
    .from('financial_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('metric_date', { ascending: false })
    .range(1, 1)
    .single();

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (prevMetrics) {
    const prevScore =
      calculateCashFlowScore(prevMetrics) * 0.25 +
      calculateProfitabilityScore(prevMetrics) * 0.25 +
      calculateExpenseScore(prevMetrics) * 0.2 +
      calculateReceivablesScore(prevMetrics) * 0.15 +
      calculateComplianceScore(prevMetrics) * 0.15;

    if (overall > prevScore + 5) trend = 'improving';
    else if (overall < prevScore - 5) trend = 'declining';
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  if (overall > 75) riskLevel = 'low';
  else if (overall < 40) riskLevel = 'high';

  return {
    overall,
    factors: {
      cashFlow: cashFlowScore,
      profitability: profitabilityScore,
      expenses: expenseScore,
      receivables: receivablesScore,
      compliance: complianceScore,
    },
    trend,
    riskLevel,
  };
}

/**
 * Calculate cash flow score (0-100)
 */
function calculateCashFlowScore(metrics: any): number {
  const cashOnHand = metrics.cash_on_hand || 0;
  const monthlyBurn = metrics.total_expenses ? metrics.total_expenses / 12 : 0;
  const runway = monthlyBurn > 0 ? cashOnHand / monthlyBurn : 0;

  // Good runway is 6+ months
  if (runway >= 6) return 100;
  if (runway >= 3) return 75 + (runway / 3) * 25;
  if (runway >= 1) return 50 + (runway / 2) * 25;
  if (runway > 0) return Math.min(50, runway * 50);
  return 0;
}

/**
 * Calculate profitability score (0-100)
 */
function calculateProfitabilityScore(metrics: any): number {
  const revenue = metrics.total_revenue || 0;
  const expenses = metrics.total_expenses || 0;

  if (revenue === 0) return 0;

  const netIncome = revenue - expenses;
  const profitMargin = (netIncome / revenue) * 100;

  // Good margin is 20%+
  if (profitMargin >= 20) return 100;
  if (profitMargin >= 10) return 60 + (profitMargin / 20) * 40;
  if (profitMargin > 0) return Math.min(60, profitMargin * 6);
  if (profitMargin >= -10) return Math.max(0, 50 + profitMargin * 5);
  return 0;
}

/**
 * Calculate expense efficiency score (0-100)
 */
function calculateExpenseScore(metrics: any): number {
  const revenue = metrics.total_revenue || 0;
  const expenses = metrics.total_expenses || 0;

  if (revenue === 0) return 50;

  const expenseRatio = (expenses / revenue) * 100;

  // Good expense ratio is 60-70% of revenue
  if (expenseRatio <= 60) return 100;
  if (expenseRatio <= 75) return 100 - (expenseRatio - 60) * 2;
  if (expenseRatio <= 90) return 70 - (expenseRatio - 75) * 2.67;
  return Math.max(0, 70 - (expenseRatio - 90) * 5);
}

/**
 * Calculate receivables health score (0-100)
 */
function calculateReceivablesScore(metrics: any): number {
  const revenue = metrics.total_revenue || 0;
  const receivables = metrics.accounts_receivable || 0;

  if (revenue === 0) return 50;

  const receivablesDays = (receivables / (revenue / 365));

  // Good DSO (Days Sales Outstanding) is 30-45 days
  if (receivablesDays <= 30) return 100;
  if (receivablesDays <= 45) return 100 - (receivablesDays - 30);
  if (receivablesDays <= 60) return 85 - (receivablesDays - 45) * 2;
  return Math.max(0, 85 - (receivablesDays - 60) * 2);
}

/**
 * Calculate compliance score (0-100)
 */
function calculateComplianceScore(metrics: any): number {
  // This would integrate with actual compliance data
  // For now, return a placeholder
  return 75;
}

/**
 * Generate CFO recommendations
 */
export async function generateRecommendations(userId: string): Promise<CFORecommendation[]> {
  const supabase = createClient();
  const recommendations: CFORecommendation[] = [];

  // Get latest metrics
  const { data: metrics } = await supabase
    .from('financial_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('metric_date', { ascending: false })
    .limit(1)
    .single();

  if (!metrics) return recommendations;

  // Cost Saving Recommendations
  const expenseRatio = (metrics.total_expenses / metrics.total_revenue) * 100;
  if (expenseRatio > 75) {
    recommendations.push({
      id: 'cost-1',
      category: 'cost_saving',
      title: 'Review and Reduce Operating Expenses',
      description: 'Your expense ratio is above 75%. Consider renegotiating supplier contracts, reducing discretionary spending, or automating processes.',
      impact: 'high',
      confidence: 0.9,
      estimatedSavings: (metrics.total_expenses * 0.1),
      priority: 'high',
    });
  }

  // Revenue Growth Recommendations
  if (metrics.accounts_receivable > metrics.total_revenue * 0.2) {
    recommendations.push({
      id: 'rev-1',
      category: 'revenue_growth',
      title: 'Accelerate Customer Collections',
      description: 'High accounts receivable indicate slow collection. Implement early payment discounts or stricter credit policies.',
      impact: 'high',
      confidence: 0.85,
      priority: 'high',
    });
  }

  // Tax Optimization Recommendations
  if (metrics.total_revenue > 0) {
    recommendations.push({
      id: 'tax-1',
      category: 'tax_optimization',
      title: 'Plan Tax Deductions',
      description: 'Review available business deductions and consider timing of large purchases for tax efficiency.',
      impact: 'medium',
      confidence: 0.8,
      priority: 'medium',
    });
  }

  // Risk Detection
  const monthlyBurn = metrics.total_expenses / 12;
  const runway = monthlyBurn > 0 ? metrics.cash_on_hand / monthlyBurn : 0;

  if (runway < 3) {
    recommendations.push({
      id: 'risk-1',
      category: 'risk_detection',
      title: 'Critical: Low Cash Runway',
      description: `Your cash runway is ${runway.toFixed(1)} months. Urgent action needed to improve cash position.`,
      impact: 'high',
      confidence: 1.0,
      priority: 'high',
    });
  }

  // Compliance Recommendations
  recommendations.push({
    id: 'comp-1',
    category: 'compliance',
    title: 'Ensure GST and Tax Compliance',
    description: 'Review all filing deadlines and ensure timely submissions to avoid penalties.',
    impact: 'medium',
    confidence: 0.75,
    priority: 'high',
  });

  // Save recommendations to database
  for (const rec of recommendations) {
    await supabase
      .from('recommendations')
      .insert([
        {
          user_id: userId,
          category: rec.category,
          recommendation: `${rec.title}: ${rec.description}`,
          impact: rec.impact,
          confidence_score: rec.confidence,
        },
      ]);
  }

  return recommendations;
}

/**
 * Generate financial forecasts
 */
export async function generateForecasts(userId: string, months = 6): Promise<Forecast[]> {
  const supabase = createClient();

  // Get historical data for trend analysis
  const { data: metrics } = await supabase
    .from('financial_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('metric_date', { ascending: false })
    .limit(12);

  if (!metrics || metrics.length === 0) {
    return [];
  }

  const forecasts: Forecast[] = [];
  const latestMetrics = metrics[0];

  // Simple linear forecast based on recent trends
  const avgRevenue = metrics.reduce((sum, m) => sum + (m.total_revenue || 0), 0) / metrics.length;
  const avgExpenses = metrics.reduce((sum, m) => sum + (m.total_expenses || 0), 0) / metrics.length;

  // Calculate growth rate
  const revenueGrowth = metrics.length > 1
    ? ((latestMetrics.total_revenue - metrics[metrics.length - 1].total_revenue) / 
       (metrics[metrics.length - 1].total_revenue || 1)) / (metrics.length - 1)
    : 0;

  for (let i = 1; i <= months; i++) {
    const forecastedRevenue = latestMetrics.total_revenue * Math.pow(1 + revenueGrowth, i);
    const forecastedExpenses = avgExpenses * (1 + (revenueGrowth * 0.5)); // Expenses grow slower

    forecasts.push({
      period: `Month +${i}`,
      revenue: forecastedRevenue,
      expenses: forecastedExpenses,
      netIncome: forecastedRevenue - forecastedExpenses,
      confidence: Math.max(0.5, 1 - (i / months) * 0.4), // Confidence decreases over time
    });
  }

  return forecasts;
}

/**
 * Get CFO Dashboard Summary
 */
export async function getCFODashboardSummary(userId: string) {
  const [healthScore, recommendations, forecasts] = await Promise.all([
    calculateHealthScore(userId),
    generateRecommendations(userId),
    generateForecasts(userId, 6),
  ]);

  return {
    healthScore,
    recommendations: recommendations.slice(0, 5), // Top 5 recommendations
    forecasts,
    actionItems: recommendations.filter((r) => r.priority === 'high'),
  };
}
