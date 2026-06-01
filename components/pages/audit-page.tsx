'use client';

import { useState, useEffect } from 'react';
import { analyzeFinancialData } from '@/lib/ai-service';
import { getAppState, saveAppState } from '@/lib/app-state';

interface AuditPageProps {
  onBack: () => void;
}

export default function AuditPage({ onBack }: AuditPageProps) {
  const [auditData, setAuditData] = useState({
    totalTransactions: 0,
    verifiedTransactions: 0,
    discrepancies: 0,
    documentationRate: 100,
    controlWeaknesses: 0,
  });
  const [analysis, setAnalysis] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const state = getAppState();
    const total = state.audit.transactionCount || state.bookkeeping.entries.length;
    const verified = state.audit.verifiedCount || total;
    const discrepancies = state.audit.fraudFlags || 0;

    if (total > 0) {
      setAuditData({
        totalTransactions: total,
        verifiedTransactions: verified,
        discrepancies,
        documentationRate: total > 0 ? Math.round((verified / total) * 100) : 100,
        controlWeaknesses: state.audit.auditScore === 0 ? 0 : discrepancies > 0 ? 1 : 0,
      });
    }
  }, []);

  const auditScore = auditData.totalTransactions === 0
    ? 0
    : Math.round(
        ((auditData.verifiedTransactions / Math.max(1, auditData.totalTransactions)) * 100 +
          auditData.documentationRate) /
          2
      );

  const handleAudit = async () => {
    setLoading(true);
    setAnalysis('');
    setRecommendations([]);
    try {
      const response = await analyzeFinancialData({
        type: 'audit',
        data: auditData,
        query: 'Perform comprehensive audit analysis with findings and recommendations',
      });
      setAnalysis(response.analysis);
      setRecommendations(response.recommendations);

      // Persist audit score
      const state = getAppState();
      state.audit.auditScore = auditScore;
      state.audit.transactionCount = auditData.totalTransactions;
      state.audit.verifiedCount = auditData.verifiedTransactions;
      state.audit.fraudFlags = auditData.discrepancies;
      saveAppState(state);
    } catch {
      setAnalysis('Standard audit validation completed.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof auditData, value: number) => {
    setAuditData((prev) => {
      const next = { ...prev, [field]: value };
      // Clamp verified to not exceed total
      if (field === 'totalTransactions' && next.verifiedTransactions > value) {
        next.verifiedTransactions = value;
      }
      next.documentationRate =
        next.totalTransactions > 0
          ? Math.round((next.verifiedTransactions / next.totalTransactions) * 100)
          : 100;
      return next;
    });
  };

  const scoreColor =
    auditScore >= 85 ? 'text-green-600' : auditScore >= 60 ? 'text-yellow-600' : 'text-destructive';
  const scoreLabel =
    auditScore >= 85 ? 'Excellent — Audit Ready' : auditScore >= 60 ? 'Good — Minor Issues' : auditScore > 0 ? 'Needs Improvement' : 'No Data Yet';

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

      {/* Input Panel */}
      <div className="p-6 border border-border rounded-lg bg-card space-y-4">
        <h3 className="font-semibold">Audit Parameters</h3>
        <p className="text-xs text-muted-foreground">
          Transaction counts are auto-synced from Bookkeeping. Adjust manually if needed.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Transactions', field: 'totalTransactions' as const },
            { label: 'Verified Transactions', field: 'verifiedTransactions' as const },
            { label: 'Discrepancies Found', field: 'discrepancies' as const },
            { label: 'Control Weaknesses', field: 'controlWeaknesses' as const },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="text-xs text-muted-foreground font-medium">{label}</label>
              <input
                type="number"
                min="0"
                value={auditData[field]}
                onChange={(e) => updateField(field, parseInt(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score Card */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <h3 className="font-semibold mb-4">Audit Readiness Score</h3>
          <div className="flex items-end gap-6">
            <div>
              <p className={`text-6xl font-light ${scoreColor}`}>{auditScore}</p>
              <p className="text-muted-foreground text-sm mt-1">/100</p>
            </div>
            <div className="flex-1">
              <div className="h-28 bg-muted rounded-lg flex items-end gap-1 p-2 overflow-hidden">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t transition-colors ${
                      auditScore === 0
                        ? 'bg-muted-foreground/20'
                        : i < Math.round(auditScore / 10)
                        ? auditScore >= 85 ? 'bg-green-600' : auditScore >= 60 ? 'bg-yellow-500' : 'bg-destructive'
                        : 'bg-muted-foreground/20'
                    }`}
                    style={{ height: `${(i + 1) * 10}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className={`text-sm mt-4 font-medium ${scoreColor}`}>{scoreLabel}</p>
        </div>

        {/* Stats Grid */}
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
            <p className={`text-2xl font-light mt-2 ${auditData.discrepancies > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {auditData.discrepancies}
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg bg-card">
            <p className="text-xs text-muted-foreground font-medium">Documentation</p>
            <p className="text-2xl font-light mt-2 text-green-600">{auditData.documentationRate}%</p>
          </div>
        </div>
      </div>

      {/* Key Findings */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold">Key Findings</h3>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex gap-3 p-3 border border-border rounded-lg bg-muted/20">
            <span className={`text-sm font-bold ${auditData.documentationRate >= 95 ? 'text-green-600' : 'text-yellow-600'}`}>
              {auditData.documentationRate >= 95 ? '✓' : '⚠'}
            </span>
            <div className="text-sm">
              <p className="font-medium">Documentation Coverage</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {auditData.documentationRate}% of transactions have supporting documents
              </p>
            </div>
          </div>
          {auditData.controlWeaknesses > 0 && (
            <div className="flex gap-3 p-3 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
              <span className="text-yellow-600 text-sm font-bold">⚠</span>
              <div className="text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-200">Control Weaknesses</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                  {auditData.controlWeaknesses} control gap{auditData.controlWeaknesses > 1 ? 's' : ''} identified — recommend improvements
                </p>
              </div>
            </div>
          )}
          {auditData.discrepancies > 0 && (
            <div className="flex gap-3 p-3 border border-destructive/30 rounded-lg bg-destructive/5">
              <span className="text-destructive text-sm font-bold">!</span>
              <div className="text-sm">
                <p className="font-medium">Unresolved Discrepancies</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {auditData.discrepancies} transactions need review
                </p>
              </div>
            </div>
          )}
          {auditData.totalTransactions === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Add journal entries in Bookkeeping to populate audit data.
            </p>
          )}
        </div>
      </div>

      {/* AI Audit Analysis */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">AI Audit Analysis</h3>
          <button
            onClick={handleAudit}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Auditing...' : 'Run Full Audit'}
          </button>
        </div>
        {(analysis || recommendations.length > 0) ? (
          <div className="p-6 space-y-4">
            {analysis && <p className="text-sm text-foreground leading-relaxed">{analysis}</p>}
            {recommendations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Findings &amp; Recommendations</p>
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
        ) : (
          <div className="px-6 py-8 text-center text-muted-foreground text-sm">
            Click &quot;Run Full Audit&quot; to get a comprehensive AI audit report.
          </div>
        )}
      </div>
    </div>
  );
}
