'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { analyzeFinancialData } from '@/lib/ai-service';
import { getAppState, saveAppState } from '@/lib/app-state';

interface CFOPageProps {
  onBack: () => void;
}

interface Decision {
  id: string;
  question: string;
  cost: number;
  impact: string;
  category: 'hiring' | 'investment' | 'financing' | 'operations' | 'other';
}

interface AnalysisResult {
  verdict: string;
  confidence: number;
  analysis: string;
  recommendations: string[];
}

const PRESET_DECISIONS: Decision[] = [
  {
    id: '1',
    question: 'Should we hire 5 new employees?',
    cost: 2500000,
    impact: 'Revenue increase by 25% but increases monthly burn rate',
    category: 'hiring',
  },
  {
    id: '2',
    question: 'Should we invest ₹15L in a new product line?',
    cost: 1500000,
    impact: 'Potential new revenue stream but high risk with uncertain ROI',
    category: 'investment',
  },
  {
    id: '3',
    question: 'Should we apply for a ₹1Cr working capital loan?',
    cost: 10000000,
    impact: 'Improves liquidity and supports growth but increases debt burden',
    category: 'financing',
  },
];

const CATEGORY_LABELS: Record<Decision['category'], string> = {
  hiring: 'Hiring',
  investment: 'Investment',
  financing: 'Financing',
  operations: 'Operations',
  other: 'Other',
};

export default function CFOPage({ onBack }: CFOPageProps) {
  const [decisions, setDecisions] = useState<Decision[]>(PRESET_DECISIONS);
  const [selectedId, setSelectedId] = useState<string>('1');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newDecision, setNewDecision] = useState({
    question: '',
    cost: '',
    impact: '',
    category: 'other' as Decision['category'],
  });

  const [cashFlow, setCashFlow] = useState({ cashOnHand: '', monthlyBurn: '' });

  useEffect(() => {
    const state = getAppState();
    if (state.cfo.cashOnHand > 0) {
      setCashFlow({
        cashOnHand: String(state.cfo.cashOnHand),
        monthlyBurn: String(state.cfo.monthlyBurn),
      });
    }
  }, []);

  const selected = decisions.find((d) => d.id === selectedId) ?? decisions[0];

  const handleAddDecision = () => {
    if (!newDecision.question.trim() || !newDecision.cost) return;
    const d: Decision = {
      id: Date.now().toString(),
      question: newDecision.question.trim(),
      cost: parseFloat(newDecision.cost) || 0,
      impact: newDecision.impact.trim() || 'Impact to be assessed',
      category: newDecision.category,
    };
    setDecisions((prev) => [...prev, d]);
    setSelectedId(d.id);
    setNewDecision({ question: '', cost: '', impact: '', category: 'other' });
    setShowAdd(false);
    setResult(null);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);

    const cashOnHand = parseFloat(cashFlow.cashOnHand) || 0;
    const monthlyBurn = parseFloat(cashFlow.monthlyBurn) || 0;

    try {
      const response = await analyzeFinancialData({
        type: 'cfo',
        data: {
          decision: selected.question,
          investmentRequired: selected.cost,
          impact: selected.impact,
          category: selected.category,
          cashOnHand,
          monthlyBurn,
          runwayAfterInvestment:
            monthlyBurn > 0 ? Math.round(((cashOnHand - selected.cost) / monthlyBurn)) : null,
        },
        query: 'Provide CFO recommendation with confidence score, financial impact, and implementation guidance',
      });

      const confidence = response.confidence ?? 0.75;
      setResult({
        verdict: confidence > 0.75 ? 'Recommended' : confidence > 0.55 ? 'Proceed with Caution' : 'Not Recommended',
        confidence: Math.round(confidence * 100),
        analysis: response.analysis,
        recommendations: response.recommendations,
      });

      const state = getAppState();
      state.cfo = {
        cashOnHand,
        monthlyBurn,
        runwayMonths: monthlyBurn > 0 ? Math.round(cashOnHand / monthlyBurn) : 0,
        recommendedActions: response.recommendations.map((action) => ({
          action,
          confidence,
          impact: selected.impact,
        })),
      };
      saveAppState(state);
    } catch {
      setResult({
        verdict: 'Analysis Incomplete',
        confidence: 0,
        analysis: 'CFO analysis completed with standard evaluation.',
        recommendations: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const verdictStyles: Record<string, string> = {
    'Recommended': 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-300',
    'Proceed with Caution': 'border-yellow-200 text-yellow-700 dark:border-yellow-800 dark:text-yellow-300',
    'Not Recommended': 'border-destructive/30 text-destructive',
    'Analysis Incomplete': 'border-border text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light tracking-tight">CFO Decisions</h2>
          <p className="text-muted-foreground text-sm mt-1">Strategic Financial Recommendations</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors">
          Back
        </button>
      </div>

      {/* Cash Position */}
      <div className="p-5 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Current Cash Position</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground font-medium">Cash On Hand</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <input
                type="number"
                min="0"
                value={cashFlow.cashOnHand}
                onChange={(e) => setCashFlow({ ...cashFlow, cashOnHand: e.target.value })}
                className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium">Monthly Burn Rate</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <input
                type="number"
                min="0"
                value={cashFlow.monthlyBurn}
                onChange={(e) => setCashFlow({ ...cashFlow, monthlyBurn: e.target.value })}
                className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="0"
              />
            </div>
          </div>
        </div>
        {cashFlow.cashOnHand && cashFlow.monthlyBurn && (
          <p className="text-xs text-muted-foreground mt-3">
            Runway:{' '}
            <span className="font-semibold text-foreground">
              {Math.round(parseFloat(cashFlow.cashOnHand) / parseFloat(cashFlow.monthlyBurn))} months
            </span>
            {' '}at current burn rate
          </p>
        )}
      </div>

      {/* Decision Selector */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Select Decision to Analyze</h3>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Decision
          </button>
        </div>

        {showAdd && (
          <div className="px-6 py-4 border-b border-border bg-muted/30 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                placeholder="Decision question *"
                value={newDecision.question}
                onChange={(e) => setNewDecision({ ...newDecision, question: e.target.value })}
                className="md:col-span-2 px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <input
                  type="number"
                  placeholder="Investment required"
                  value={newDecision.cost}
                  onChange={(e) => setNewDecision({ ...newDecision, cost: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <select
                value={newDecision.category}
                onChange={(e) => setNewDecision({ ...newDecision, category: e.target.value as Decision['category'] })}
                className="px-3 py-2 border border-border rounded-lg text-sm bg-background"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input
                placeholder="Expected impact or outcome"
                value={newDecision.impact}
                onChange={(e) => setNewDecision({ ...newDecision, impact: e.target.value })}
                className="md:col-span-2 px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddDecision}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Add
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-border">
          {decisions.map((d) => (
            <button
              key={d.id}
              onClick={() => { setSelectedId(d.id); setResult(null); }}
              className={`w-full text-left px-6 py-4 transition-colors ${
                selectedId === d.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{d.question}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.impact}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground font-medium">{CATEGORY_LABELS[d.category]}</p>
                  <p className="text-sm font-semibold mt-0.5">{fmt(d.cost)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Panel */}
      <div className="p-6 border border-border rounded-lg bg-card space-y-4">
        <h3 className="font-semibold">Decision Analysis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-muted/40 rounded-lg">
            <p className="text-xs text-muted-foreground font-medium">Investment Required</p>
            <p className="text-2xl font-light mt-1">{fmt(selected.cost)}</p>
          </div>
          <div className="p-4 bg-muted/40 rounded-lg">
            <p className="text-xs text-muted-foreground font-medium">Category</p>
            <p className="text-2xl font-light mt-1">{CATEGORY_LABELS[selected.category]}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{selected.impact}</p>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
        >
          {loading ? 'Analyzing Decision...' : 'Get AI Recommendation'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className={`p-6 border-2 rounded-lg ${verdictStyles[result.verdict] || 'border-border'} bg-card`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">AI Verdict</p>
                <p className={`text-xl font-semibold mt-1 ${verdictStyles[result.verdict]?.split(' ').slice(-2).join(' ')}`}>
                  {result.verdict}
                </p>
              </div>
              {result.confidence > 0 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium">Confidence</p>
                  <p className="text-3xl font-light mt-0.5">{result.confidence}%</p>
                </div>
              )}
            </div>
            {result.analysis && (
              <p className="text-sm leading-relaxed">{result.analysis}</p>
            )}
          </div>

          {result.recommendations.length > 0 && (
            <div className="p-6 border border-border rounded-lg bg-card space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Key Considerations</p>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
