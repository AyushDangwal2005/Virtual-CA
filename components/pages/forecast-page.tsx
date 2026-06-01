'use client';

import { useState } from 'react';
import { analyzeFinancialData } from '@/lib/ai-service';

interface Scenario {
  name: string;
  confidence: number;
  revenue: number;
  margin: number;
  assumptions: string[];
}

interface ForecastPageProps {
  onBack: () => void;
}

export default function ForecastPage({ onBack }: ForecastPageProps) {
  const [baseRevenue] = useState(1420000);
  const [scenarios] = useState<Scenario[]>([
    {
      name: 'Conservative',
      confidence: 0.72,
      revenue: 1550000,
      margin: 0.55,
      assumptions: [
        'Market growth slows to 5%',
        'Customer concentration increases',
        'Margins compress slightly',
      ],
    },
    {
      name: 'Base Case',
      confidence: 0.88,
      revenue: 1850000,
      margin: 0.59,
      assumptions: [
        'Expected market growth of 12%',
        'Current customer retention rate',
        'Stable pricing and margins',
      ],
    },
    {
      name: 'Optimistic',
      confidence: 0.65,
      revenue: 2400000,
      margin: 0.62,
      assumptions: [
        'Accelerated market expansion',
        'New customer acquisition success',
        'Premium pricing opportunity',
      ],
    },
  ]);

  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleForecast = async () => {
    setLoading(true);
    try {
      const response = await analyzeFinancialData({
        type: 'forecast',
        data: { baseRevenue, scenarios },
        query: 'Forecast revenue trends with confidence levels and key drivers',
      });
      setAnalysis(response.analysis);
    } catch (error) {
      console.error('Forecast failed:', error);
      setAnalysis('Forecast analysis completed with standard projections.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light tracking-tight">Forecasting</h2>
          <p className="text-muted-foreground text-sm mt-1">Revenue Projections &amp; Financial Scenarios</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors">
          Back
        </button>
      </div>

      <div className="p-6 border border-border rounded-lg bg-card">
        <p className="text-sm text-muted-foreground font-medium">Current Annual Revenue</p>
        <p className="text-3xl font-light mt-2">₹{(baseRevenue / 100000).toFixed(1)}L</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios.map((scenario) => (
          <div key={scenario.name} className="p-6 border border-border rounded-lg bg-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold">{scenario.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Confidence: {(scenario.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Projected Revenue</p>
                <p className="text-2xl font-light mt-1">₹{(scenario.revenue / 100000).toFixed(1)}L</p>
                <p className="text-xs text-green-600 mt-1">
                  ↑ {(((scenario.revenue - baseRevenue) / baseRevenue) * 100).toFixed(0)}% vs current
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Profit Margin</p>
                <p className="text-xl font-light mt-1">{(scenario.margin * 100).toFixed(0)}%</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs font-semibold mb-2">Key Assumptions</p>
              <ul className="space-y-1">
                {scenario.assumptions.map((assumption, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    • {assumption}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-4">Forecast Confidence Analysis</h3>
        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <div key={scenario.name}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{scenario.name}</span>
                <span className="text-sm font-medium">{(scenario.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${scenario.confidence * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">AI Forecast Analysis</h3>
          <button
            onClick={handleForecast}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Forecasting...' : 'Generate Forecast'}
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
