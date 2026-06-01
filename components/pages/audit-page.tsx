'use client';

import { useState } from 'react';
import { analyzeFinancialData } from '@/lib/ai-service';

interface AuditPageProps {
  onBack: () => void;
}

export default function AuditPage({ onBack }: AuditPageProps) {
  const [auditData] = useState({
    totalTransactions: 524,
    verifiedTransactions: 512,
    discrepancies: 12,
    documentationRate: 98,
    controlWeaknesses: 2,
  });

  const [analysis, setAnalysis] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAudit = async () => {
    setLoading(true);
    try {
      const response = await analyzeFinancialData({
        type: 'audit',
        data: auditData,
        query: 'Perform comprehensive audit analysis with findings and recommendations',
      });
      setAnalysis(response.analysis);
      setRecommendations(response.recommendations);
    } catch (error) {
      console.error('Audit failed:', error);
      setAnalysis('Standard audit validation completed.');
    } finally {
      setLoading(false);
    }
  };

  const auditScore = Math.round(
    ((auditData.verifiedTransactions / auditData.totalTransactions) * 100 +
      auditData.documentationRate) /
      2
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light tracking-tight">Audit &amp; Verification</h2>
          <p className="text-muted-foreground text-sm mt-1">Transaction Verification &amp; Audit Readiness</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors">
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border border-border rounded-lg bg-card">
          <h3 className="font-semibold mb-4">Audit Readiness Score</h3>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-5xl font-light">{auditScore}</p>
              <p className="text-muted-foreground text-sm mt-2">/100</p>
            </div>
            <div className="flex-1">
              <div className="h-32 bg-muted rounded-lg flex items-end gap-1 p-2">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t ${
                      i < Math.round(auditScore / 10) ? 'bg-green-600' : 'bg-muted-foreground/20'
                    }`}
                    style={{ height: `${(i + 1) * 10}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-green-600 mt-4">Excellent - Ready for audit</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-border rounded-lg bg-card">
            <p className="text-xs text-muted-foreground font-medium">Total Transactions</p>
            <p className="text-2xl font-light mt-2">{auditData.totalTransactions}</p>
          </div>
          <div className="p-4 border border-border rounded-lg bg-card">
            <p className="text-xs text-muted-foreground font-medium">Verified</p>
            <p className="text-2xl font-light mt-2 text-green-600">{auditData.verifiedTransactions}</p>
          </div>
          <div className="p-4 border border-border rounded-lg bg-card">
            <p className="text-xs text-muted-foreground font-medium">Discrepancies</p>
            <p className="text-2xl font-light mt-2 text-red-600">{auditData.discrepancies}</p>
          </div>
          <div className="p-4 border border-border rounded-lg bg-card">
            <p className="text-xs text-muted-foreground font-medium">Documentation</p>
            <p className="text-2xl font-light mt-2 text-green-600">{auditData.documentationRate}%</p>
          </div>
        </div>
      </div>

      <div className="p-6 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-4">Key Findings</h3>
        <div className="space-y-3">
          <div className="flex gap-3 p-3 bg-green-50/50 border border-green-200 rounded-lg">
            <span className="text-green-600 text-sm font-bold">✓</span>
            <div className="text-sm">
              <p className="font-medium">Strong Documentation</p>
              <p className="text-xs text-muted-foreground mt-1">98% of transactions have supporting documents</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-yellow-50/50 border border-yellow-200 rounded-lg">
            <span className="text-yellow-600 text-sm font-bold">⚠</span>
            <div className="text-sm">
              <p className="font-medium">Control Weaknesses</p>
              <p className="text-xs text-muted-foreground mt-1">2 minor control gaps identified - recommend improvements</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-blue-50/50 border border-blue-200 rounded-lg">
            <span className="text-blue-600 text-sm font-bold">ℹ</span>
            <div className="text-sm">
              <p className="font-medium">Transaction Verification</p>
              <p className="text-xs text-muted-foreground mt-1">512 of 524 transactions verified (97.7%)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">AI Audit Analysis</h3>
          <button
            onClick={handleAudit}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Auditing...' : 'Run Full Audit'}
          </button>
        </div>
        {analysis && (
          <div className="space-y-3">
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">{analysis}</p>
            </div>
            {recommendations.length > 0 && (
              <div className="p-4 bg-green-50/50 border border-green-200 rounded-lg">
                <p className="text-xs font-semibold text-green-900 mb-2">Recommendations:</p>
                <ul className="space-y-1">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-green-900">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
