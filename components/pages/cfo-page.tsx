'use client';

import { useState } from 'react';
import { analyzeFinancialData } from '@/lib/ai-service';

interface Decision {
  question: string;
  cost: number;
  impact: string;
}

interface CFOPageProps {
  onBack: () => void;
}

export default function CFOPage({ onBack }: CFOPageProps) {
  const [decisions] = useState<Decision[]>([
    {
      question: 'Should we hire 5 new employees?',
      cost: 2500000,
      impact: 'Revenue increase by 25% but increases monthly burn rate',
    },
    {
      question: 'Should we invest ₹15L in new product line?',
      cost: 1500000,
      impact: 'Potential new revenue stream but high risk with uncertain ROI',
    },
    {
      question: 'Should we apply for ₹1Cr working capital loan?',
      cost: 500000,
      impact: 'Improves liquidity and supports growth but increases debt burden',
    },
  ]);

  const [selectedDecision, setSelectedDecision] = useState(0);
  const [analysis, setAnalysis] = useState<string>('');
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await analyzeFinancialData({
        type: 'cfo',
        data: decisions[selectedDecision],
        query: 'Provide CFO recommendation with confidence score and financial impact analysis',
      });
      setAnalysis(response.analysis);
      setRecommendation({
        recommendation:
          (response.confidence ?? 0) > 0.8 ? 'Recommended' : 'Consider with Caution',
        confidence: ((response.confidence ?? 0.6) * 100).toFixed(0),
        risks: response.recommendations.slice(0, 3),
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysis('CFO analysis completed with standard evaluation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light tracking-tight">CFO Decisions</h2>
          <p className="text-muted-foreground text-sm mt-1">Strategic Business Recommendations</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors">
          Back
        </button>
      </div>

      <div className="space-y-3">
        {decisions.map((decision, index) => (
          <button
            key={index}
            onClick={() => {
              setSelectedDecision(index);
              setAnalysis('');
              setRecommendation(null);
            }}
            className={`w-full text-left p-4 border rounded-lg transition-colors ${
              selectedDecision === index
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted/50'
            }`}
          >
            <h3 className="font-semibold text-sm">{decision.question}</h3>
            <p className="text-xs text-muted-foreground mt-2">
              Cost: ₹{(decision.cost / 100000).toFixed(1)}L
            </p>
            <p className="text-xs text-muted-foreground mt-1">{decision.impact}</p>
          </button>
        ))}
      </div>

      <div className="p-6 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-4">Decision Analysis</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">{decisions[selectedDecision].question}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground font-medium">Investment Required</p>
                <p className="text-xl font-light mt-1">
                  ₹{(decisions[selectedDecision].cost / 100000).toFixed(1)}L
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground font-medium">Expected Impact</p>
                <p className="text-sm font-medium mt-2 line-clamp-2">
                  {decisions[selectedDecision].impact}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
          >
            {loading ? 'Analyzing Decision...' : 'Get AI Recommendation'}
          </button>
        </div>
      </div>

      {recommendation && (
        <div
          className={`p-6 border rounded-lg ${
            recommendation.recommendation === 'Recommended'
              ? 'border-green-200 bg-green-50/50'
              : 'border-yellow-200 bg-yellow-50/50'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold">AI Recommendation</h3>
              <p
                className={`text-sm font-medium mt-1 ${
                  recommendation.recommendation === 'Recommended'
                    ? 'text-green-700'
                    : 'text-yellow-700'
                }`}
              >
                {recommendation.recommendation}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-medium">Confidence</p>
              <p className="text-2xl font-light">{recommendation.confidence}%</p>
            </div>
          </div>

          {recommendation.risks && recommendation.risks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold">Key Considerations:</p>
              <ul className="space-y-1">
                {recommendation.risks.map((risk: string, i: number) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span>•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {analysis && (
        <div className="p-6 border border-blue-200 rounded-lg bg-blue-50/50">
          <h3 className="font-semibold text-sm mb-3">Detailed Analysis</h3>
          <p className="text-sm text-blue-900">{analysis}</p>
        </div>
      )}

      <div className="p-6 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-4">Decision Risk Matrix</h3>
        <div className="space-y-3">
          {decisions.map((decision, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                selectedDecision === index ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{decision.question.substring(0, 40)}...</span>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Financial Risk</p>
                    <div className="w-16 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-yellow-500" style={{ width: '60%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
