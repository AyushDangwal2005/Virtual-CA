'use client';

import { useState, useEffect } from 'react';
import { analyzeFinancialData } from '@/lib/ai-service';
import { getAppState, saveAppState } from '@/lib/app-state';

interface RiskPageProps {
  onBack: () => void;
}

interface RiskInputs {
  cashReserves: string;
  monthlyBurn: string;
  revenue: string;
  topCustomerRevenue: string;
  topVendorDependency: string;
  debtToEquity: string;
}

interface RiskScores {
  cashFlow: number;
  customer: number;
  vendor: number;
  leverage: number;
  compliance: number;
}

export default function RiskPage({ onBack }: RiskPageProps) {
  const [inputs, setInputs] = useState<RiskInputs>({
    cashReserves: '',
    monthlyBurn: '',
    revenue: '',
    topCustomerRevenue: '',
    topVendorDependency: '',
    debtToEquity: '',
  });
  const [analysis, setAnalysis] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [riskScores, setRiskScores] = useState<RiskScores | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const state = getAppState();
    // Pre-fill from bookkeeping data if available
    if (state.bookkeeping.totalDebit > 0) {
      setInputs((prev) => ({
        ...prev,
        revenue: String(state.bookkeeping.totalDebit),
      }));
    }
    if (state.cfo.cashOnHand > 0) {
      setInputs((prev) => ({
        ...prev,
        cashReserves: String(state.cfo.cashOnHand),
        monthlyBurn: String(state.cfo.monthlyBurn),
      }));
    }
  }, []);

  const parseInputs = () => ({
    cashReserves: parseFloat(inputs.cashReserves) || 0,
    monthlyBurn: parseFloat(inputs.monthlyBurn) || 1,
    revenue: parseFloat(inputs.revenue) || 0,
    topCustomerRevenue: parseFloat(inputs.topCustomerRevenue) || 0,
    topVendorDependency: parseFloat(inputs.topVendorDependency) || 0,
    debtToEquity: parseFloat(inputs.debtToEquity) || 0,
  });

  const computeRiskScores = (data: ReturnType<typeof parseInputs>): RiskScores => {
    const cashDaysOnHand = (data.cashReserves / data.monthlyBurn) * 30;
    const cashFlowRisk = cashDaysOnHand > 90 ? 10 : cashDaysOnHand > 60 ? 25 : cashDaysOnHand > 30 ? 45 : 75;

    const customerConcentration = data.revenue > 0 ? (data.topCustomerRevenue / data.revenue) * 100 : 0;
    const customerRisk = customerConcentration > 50 ? 80 : customerConcentration > 30 ? 55 : customerConcentration > 15 ? 35 : 15;

    const vendorConcentration = data.revenue > 0 ? (data.topVendorDependency / data.revenue) * 100 : 0;
    const vendorRisk = vendorConcentration > 40 ? 70 : vendorConcentration > 25 ? 48 : vendorConcentration > 10 ? 30 : 15;

    const leverageRisk = data.debtToEquity > 2 ? 85 : data.debtToEquity > 1 ? 60 : data.debtToEquity > 0.5 ? 35 : 15;

    const state = getAppState();
    const overdueCount = state.compliance.filings.filter((f) => f.status === 'overdue').length;
    const complianceRisk = overdueCount > 3 ? 70 : overdueCount > 1 ? 45 : overdueCount > 0 ? 25 : 10;

    return {
      cashFlow: cashFlowRisk,
      customer: customerRisk,
      vendor: vendorRisk,
      leverage: leverageRisk,
      compliance: complianceRisk,
    };
  };

  const handleAnalyze = async () => {
    setError('');
    const data = parseInputs();
    if (data.revenue === 0 && data.cashReserves === 0) {
      setError('Enter at least Revenue or Cash Reserves to run the analysis.');
      return;
    }

    setLoading(true);
    setAnalysis('');
    setRecommendations([]);

    const scores = computeRiskScores(data);
    const overallRisk = Math.round(
      (scores.cashFlow + scores.customer + scores.vendor + scores.leverage + scores.compliance) / 5
    );

    try {
      const response = await analyzeFinancialData({
        type: 'risk',
        data: { ...data, riskScores: scores, overallRisk },
        query: 'Comprehensive risk analysis across cash flow, vendor, customer, and leverage risks',
      });
      setAnalysis(response.analysis);
      setRecommendations(response.recommendations);
      setRiskScores(scores);

      const state = getAppState();
      state.risk = {
        cashRisk: { score: scores.cashFlow, assessment: scores.cashFlow > 60 ? 'High' : scores.cashFlow > 40 ? 'Medium' : 'Low' },
        taxRisk: { score: scores.compliance, assessment: scores.compliance > 60 ? 'High' : 'Low' },
        vendorRisk: { score: scores.vendor, assessment: scores.vendor > 60 ? 'High' : 'Medium' },
        customerRisk: { score: scores.customer, assessment: scores.customer > 60 ? 'High' : 'Medium' },
        complianceRisk: { score: scores.compliance, assessment: 'Standard' },
        overallRisk,
      };
      saveAppState(state);
    } catch {
      setRiskScores(scores);
      setAnalysis('Risk assessment completed with standard analysis.');
    } finally {
      setLoading(false);
    }
  };

  const data = parseInputs();
  const cashDaysOnHand = data.monthlyBurn > 0 ? Math.round((data.cashReserves / data.monthlyBurn) * 30) : 0;
  const customerConc = data.revenue > 0 ? Math.round((data.topCustomerRevenue / data.revenue) * 100) : 0;
  const vendorDep = data.revenue > 0 ? Math.round((data.topVendorDependency / data.revenue) * 100) : 0;

  const riskColor = (score: number) =>
    score > 60 ? 'bg-destructive' : score > 40 ? 'bg-yellow-500' : 'bg-green-600';
  const riskLabel = (score: number) =>
    score > 60 ? 'text-destructive' : score > 40 ? 'text-yellow-600' : 'text-green-600';
  const riskText = (score: number) =>
    score > 60 ? 'High Risk' : score > 40 ? 'Medium Risk' : 'Low Risk';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light tracking-tight">Risk Analytics</h2>
          <p className="text-muted-foreground text-sm mt-1">Comprehensive Risk Assessment &amp; Mitigation</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors">
          Back
        </button>
      </div>

      {/* Input Panel */}
      <div className="p-6 border border-border rounded-lg bg-card space-y-4">
        <h3 className="font-semibold">Risk Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Cash Reserves', key: 'cashReserves', prefix: '₹' },
            { label: 'Monthly Burn Rate', key: 'monthlyBurn', prefix: '₹' },
            { label: 'Annual Revenue', key: 'revenue', prefix: '₹' },
            { label: 'Top Customer Revenue', key: 'topCustomerRevenue', prefix: '₹' },
            { label: 'Top Vendor Spend', key: 'topVendorDependency', prefix: '₹' },
            { label: 'Debt-to-Equity Ratio', key: 'debtToEquity', prefix: '' },
          ].map(({ label, key, prefix }) => (
            <div key={key}>
              <label className="text-sm font-medium">{label}</label>
              <div className="relative mt-1.5">
                {prefix && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {prefix}
                  </span>
                )}
                <input
                  type="number"
                  min="0"
                  step={key === 'debtToEquity' ? '0.01' : '1000'}
                  value={inputs[key as keyof RiskInputs]}
                  onChange={(e) => setInputs({ ...inputs, [key]: e.target.value })}
                  className={`w-full ${prefix ? 'pl-7' : 'pl-3'} pr-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Analyzing...' : 'Analyze Risks'}
        </button>
      </div>

      {/* Quick Metrics */}
      {(cashDaysOnHand > 0 || customerConc > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-border rounded-lg bg-card">
            <p className="text-xs text-muted-foreground font-medium">Cash Days On Hand</p>
            <p className="text-2xl font-light mt-2">{cashDaysOnHand}</p>
            <p className={`text-xs mt-1 ${riskLabel(cashDaysOnHand > 90 ? 10 : cashDaysOnHand > 60 ? 25 : 60)}`}>
              {cashDaysOnHand > 90 ? 'Low Risk' : cashDaysOnHand > 60 ? 'Medium Risk' : 'High Risk'}
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg bg-card">
            <p className="text-xs text-muted-foreground font-medium">Customer Concentration</p>
            <p className="text-2xl font-light mt-2">{customerConc}%</p>
            <p className={`text-xs mt-1 ${riskLabel(customerConc > 50 ? 80 : customerConc > 30 ? 55 : 20)}`}>
              {customerConc > 50 ? 'High Risk' : customerConc > 30 ? 'Medium Risk' : 'Low Risk'}
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg bg-card">
            <p className="text-xs text-muted-foreground font-medium">Vendor Dependency</p>
            <p className="text-2xl font-light mt-2">{vendorDep}%</p>
            <p className={`text-xs mt-1 ${riskLabel(vendorDep > 40 ? 70 : vendorDep > 25 ? 48 : 20)}`}>
              {vendorDep > 40 ? 'High Risk' : vendorDep > 25 ? 'Medium Risk' : 'Low Risk'}
            </p>
          </div>
        </div>
      )}

      {/* Risk Score Bars */}
      {riskScores && (
        <div className="p-6 border border-border rounded-lg bg-card space-y-4">
          <h3 className="font-semibold">Risk Scores</h3>
          <div className="space-y-3">
            {(Object.entries(riskScores) as [string, number][]).map(([category, score]) => (
              <div key={category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium capitalize">{category.replace(/([A-Z])/g, ' $1').trim()} Risk</span>
                  <span className={`text-sm font-semibold ${riskLabel(score)}`}>{riskText(score)}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${riskColor(score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {(analysis || recommendations.length > 0) && (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold">AI Risk Analysis</h3>
          </div>
          <div className="p-6 space-y-4">
            {analysis && <p className="text-sm text-foreground leading-relaxed">{analysis}</p>}
            {recommendations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mitigation Strategies</p>
                <ul className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
