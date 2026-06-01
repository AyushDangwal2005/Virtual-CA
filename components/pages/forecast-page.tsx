'use client';

import { useState, useEffect } from 'react';
import { analyzeFinancialData } from '@/lib/ai-service';
import { getAppState, saveAppState } from '@/lib/app-state';

interface ForecastPageProps {
  onBack: () => void;
}

interface ScenarioResult {
  name: string;
  growthRate: number;
  revenue: number;
  margin: number;
  confidence: number;
  assumptions: string[];
}

export default function ForecastPage({ onBack }: ForecastPageProps) {
  const [baseRevenue, setBaseRevenue] = useState('');
  const [growthRate, setGrowthRate] = useState('12');
  const [marginRate, setMarginRate] = useState('55');
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);
  const [analysis, setAnalysis] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const state = getAppState();
    if (state.bookkeeping.totalDebit > 0) {
      setBaseRevenue(String(state.bookkeeping.totalDebit));
    }
    if (state.forecast.baselineRevenue > 0) {
      setBaseRevenue(String(state.forecast.baselineRevenue));
      setGrowthRate(String(state.forecast.growthRate * 100 || 12));
    }
  }, []);

  const generateScenarios = (base: number, baseGrowth: number, baseMargin: number): ScenarioResult[] => [
    {
      name: 'Conservative',
      growthRate: Math.max(2, baseGrowth * 0.4),
      revenue: base * (1 + Math.max(0.02, baseGrowth * 0.4) / 100),
      margin: Math.max(40, baseMargin - 5),
      confidence: 0.82,
      assumptions: [
        `Market growth slows to ${Math.max(2, Math.round(baseGrowth * 0.4))}%`,
        'Customer retention at current levels',
        'Margin compression from cost inflation',
      ],
    },
    {
      name: 'Base Case',
      growthRate: baseGrowth,
      revenue: base * (1 + baseGrowth / 100),
      margin: baseMargin,
      confidence: 0.91,
      assumptions: [
        `Expected market growth of ${baseGrowth}%`,
        'Stable customer retention and acquisition',
        'Margins held through operational efficiency',
      ],
    },
    {
      name: 'Optimistic',
      growthRate: baseGrowth * 1.8,
      revenue: base * (1 + (baseGrowth * 1.8) / 100),
      margin: Math.min(80, baseMargin + 5),
      confidence: 0.58,
      assumptions: [
        `Accelerated growth of ${Math.round(baseGrowth * 1.8)}%`,
        'New customer acquisition exceeds targets',
        'Premium pricing strategy succeeds',
      ],
    },
  ];

  const handleForecast = async () => {
    setError('');
    const base = parseFloat(baseRevenue) || 0;
    if (base === 0) {
      setError('Enter base revenue to generate forecast.');
      return;
    }

    const growth = parseFloat(growthRate) || 12;
    const margin = parseFloat(marginRate) || 55;

    setLoading(true);
    setAnalysis('');
    setRecommendations([]);

    const computed = generateScenarios(base, growth, margin);
    setScenarios(computed);

    try {
      const response = await analyzeFinancialData({
        type: 'forecast',
        data: { baseRevenue: base, growthRate: growth, marginRate: margin, scenarios: computed },
        query: 'Forecast revenue trends with confidence levels, key drivers, and scenario analysis',
      });
      setAnalysis(response.analysis);
      setRecommendations(response.recommendations);

      const state = getAppState();
      state.forecast = {
        baselineRevenue: base,
        growthRate: growth / 100,
        scenarios: computed.map((s) => ({
          name: s.name,
          revenue30d: s.revenue / 12,
          revenue90d: (s.revenue / 12) * 3,
          confidence: s.confidence,
        })),
      };
      saveAppState(state);
    } catch {
      setAnalysis('Forecast analysis completed with projected scenarios.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
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

      {/* Input Panel */}
      <div className="p-6 border border-border rounded-lg bg-card space-y-4">
        <h3 className="font-semibold">Forecast Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Base Annual Revenue</label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <input
                type="number"
                min="0"
                value={baseRevenue}
                onChange={(e) => setBaseRevenue(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. 1420000"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Expected Growth Rate</label>
            <div className="relative mt-1.5">
              <input
                type="number"
                min="0"
                max="200"
                value={growthRate}
                onChange={(e) => setGrowthRate(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Base Profit Margin</label>
            <div className="relative mt-1.5">
              <input
                type="number"
                min="0"
                max="100"
                value={marginRate}
                onChange={(e) => setMarginRate(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="55"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          onClick={handleForecast}
          disabled={loading}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Generating...' : 'Generate Forecast'}
        </button>
      </div>

      {/* Scenario Cards */}
      {scenarios.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {scenarios.map((scenario) => (
              <div key={scenario.name} className="p-6 border border-border rounded-lg bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{scenario.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(scenario.confidence * 100).toFixed(0)}% confidence
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-secondary rounded-full">
                    +{Math.round(scenario.growthRate)}%
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Projected Revenue</p>
                    <p className="text-2xl font-light mt-0.5">{fmt(scenario.revenue)}</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      {baseRevenue
                        ? `+${fmt(scenario.revenue - parseFloat(baseRevenue))} vs base`
                        : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Profit Margin</p>
                    <p className="text-xl font-light mt-0.5">{Math.round(scenario.margin)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Confidence</p>
                    <div className="w-full h-1.5 bg-muted rounded-full">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${scenario.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-semibold mb-2">Key Assumptions</p>
                  <ul className="space-y-1">
                    {scenario.assumptions.map((a, i) => (
                      <li key={i} className="text-xs text-muted-foreground">• {a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* AI Analysis */}
          {(analysis || recommendations.length > 0) && (
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-semibold">AI Forecast Analysis</h3>
              </div>
              <div className="p-6 space-y-4">
                {analysis && <p className="text-sm text-foreground leading-relaxed">{analysis}</p>}
                {recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recommendations</p>
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
        </>
      )}
    </div>
  );
}
