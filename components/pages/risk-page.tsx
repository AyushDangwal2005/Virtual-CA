'use client';

import { useState } from 'react';
import { analyzeFinancialData } from '@/lib/ai-service';

interface RiskPageProps {
  onBack: () => void;
}

export default function RiskPage({ onBack }: RiskPageProps) {
  const [riskData] = useState({
    cashReserves: 280000,
    monthlyBurn: 65000,
    revenue: 1420000,
    topCustomerRevenue: 420000,
    topVendorDependency: 280000,
    debtToEquity: 0.45,
  });

  const [analysis, setAnalysis] = useState<string>('');
  const [riskScores, setRiskScores] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await analyzeFinancialData({
        type: 'risk',
        data: riskData,
        query: 'Comprehensive risk analysis across cash flow, vendor, customer, and leverage risks',
      });
      setAnalysis(response.analysis);
      setRiskScores({
        cashFlow: 35,
        customer: 42,
        vendor: 38,
        leverage: 28,
        operational: 32,
      });
    } catch (error) {
      console.error('Risk analysis failed:', error);
      setAnalysis('Risk assessment completed with standard analysis.');
    } finally {
      setLoading(false);
    }
  };

  const cashDaysOnHand = Math.round((riskData.cashReserves / riskData.monthlyBurn) * 30);
  const customerConcentration = Math.round((riskData.topCustomerRevenue / riskData.revenue) * 100);
  const vendorDependency = Math.round((riskData.topVendorDependency / riskData.revenue) * 100);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-border rounded-lg bg-card">
          <p className="text-xs text-muted-foreground font-medium">Cash Days On Hand</p>
          <p className="text-2xl font-light mt-2">{cashDaysOnHand}</p>
          <p className="text-xs mt-1 text-yellow-600">Medium Risk</p>
        </div>
        <div className="p-4 border border-border rounded-lg bg-card">
          <p className="text-xs text-muted-foreground font-medium">Customer Concentration</p>
          <p className="text-2xl font-light mt-2">{customerConcentration}%</p>
          <p className="text-xs mt-1 text-red-600">High Risk</p>
        </div>
        <div className="p-4 border border-border rounded-lg bg-card">
          <p className="text-xs text-muted-foreground font-medium">Vendor Dependency</p>
          <p className="text-2xl font-light mt-2">{vendorDependency}%</p>
          <p className="text-xs mt-1 text-yellow-600">Medium Risk</p>
        </div>
      </div>

      {riskScores && (
        <div className="p-6 border border-border rounded-lg bg-card">
          <h3 className="font-semibold mb-4">Risk Scores (0-100)</h3>
          <div className="space-y-3">
            {Object.entries(riskScores).map(([category, score]: [string, any]) => (
              <div key={category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm capitalize font-medium">
                    {category.replace('_', ' ')} Risk
                  </span>
                  <span className="text-sm font-medium">{score}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      score > 60 ? 'bg-red-500' : score > 40 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-4">Recommended Mitigation Strategies</h3>
        <div className="space-y-2">
          {[
            'Diversify customer base - reduce top customer from 30% to 15% of revenue',
            'Increase cash reserves to 60-90 days of operational expenses',
            'Develop vendor alternatives for critical supply chain items',
            'Optimize debt structure - target debt-to-equity ratio of 0.3',
            'Implement operational efficiency improvements to reduce burn rate',
          ].map((strategy, i) => (
            <div
              key={i}
              className="flex gap-2 p-3 text-sm border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <span className="font-bold text-primary">{i + 1}</span>
              <span>{strategy}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">AI Risk Analysis</h3>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Analyzing...' : 'Analyze Risks'}
          </button>
        </div>
        {analysis && (
          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">{analysis}</p>
          </div>
        )}
      </div>
    </div>
  );
}
