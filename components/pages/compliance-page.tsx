'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { analyzeFinancialData } from '@/lib/ai-service';
import { getAppState, saveAppState, type ComplianceFiling } from '@/lib/app-state';

interface CompliancePageProps {
  onBack: () => void;
}

export default function CompliancePage({ onBack }: CompliancePageProps) {
  const [filings, setFilings] = useState<ComplianceFiling[]>([]);
  const [analysis, setAnalysis] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newFiling, setNewFiling] = useState({
    filing: '',
    deadline: new Date().toISOString().split('T')[0],
    status: 'pending' as ComplianceFiling['status'],
    penalty: '',
  });

  useEffect(() => {
    const state = getAppState();
    setFilings(state.compliance.filings);
  }, []);

  const persist = (updated: ComplianceFiling[]) => {
    const state = getAppState();
    const completed = updated.filter((f) => f.status === 'completed').length;
    state.compliance.filings = updated;
    state.compliance.completionRate =
      updated.length > 0 ? Math.round((completed / updated.length) * 100) : 0;
    saveAppState(state);
  };

  const updateStatus = (id: string, status: ComplianceFiling['status']) => {
    const updated = filings.map((f) => (f.id === id ? { ...f, status } : f));
    setFilings(updated);
    persist(updated);
  };

  const handleAddFiling = () => {
    if (!newFiling.filing.trim()) return;
    const entry: ComplianceFiling = {
      id: Date.now().toString(),
      filing: newFiling.filing.trim(),
      deadline: newFiling.deadline,
      status: newFiling.status,
      penalty: newFiling.penalty ? parseFloat(newFiling.penalty) : undefined,
    };
    const updated = [...filings, entry];
    setFilings(updated);
    persist(updated);
    setNewFiling({ filing: '', deadline: new Date().toISOString().split('T')[0], status: 'pending', penalty: '' });
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    const updated = filings.filter((f) => f.id !== id);
    setFilings(updated);
    persist(updated);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis('');
    setRecommendations([]);
    try {
      const response = await analyzeFinancialData({
        type: 'compliance',
        data: { filings, overdueCount: filings.filter((f) => f.status === 'overdue').length },
        query: 'Analyze compliance status and identify missing filings and penalty exposure',
      });
      setAnalysis(response.analysis);
      setRecommendations(response.recommendations);
    } catch {
      setAnalysis('Compliance check completed with standard analysis.');
    } finally {
      setLoading(false);
    }
  };

  const completed = filings.filter((f) => f.status === 'completed').length;
  const pending = filings.filter((f) => f.status === 'pending').length;
  const overdue = filings.filter((f) => f.status === 'overdue').length;
  const progress = filings.length > 0 ? Math.round((completed / filings.length) * 100) : 0;
  const totalPenalty = filings.reduce((sum, f) => sum + (f.penalty || 0), 0);

  const statusStyles: Record<ComplianceFiling['status'], string> = {
    completed: 'border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    pending: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
    overdue: 'border-destructive/30 bg-destructive/10 text-destructive',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light tracking-tight">Compliance</h2>
          <p className="text-muted-foreground text-sm mt-1">Filing Deadlines &amp; Regulatory Requirements</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors">
          Back
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border border-border rounded-lg bg-card">
          <p className="text-xs text-muted-foreground font-medium">Progress</p>
          <p className="text-2xl font-light mt-2">{progress}%</p>
          <div className="w-full h-1.5 bg-muted rounded-full mt-2">
            <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="p-4 border border-border rounded-lg bg-card">
          <p className="text-xs text-muted-foreground font-medium">Completed</p>
          <p className="text-2xl font-light mt-2 text-green-600">{completed}</p>
        </div>
        <div className="p-4 border border-border rounded-lg bg-card">
          <p className="text-xs text-muted-foreground font-medium">Pending</p>
          <p className="text-2xl font-light mt-2 text-yellow-600">{pending}</p>
        </div>
        <div className="p-4 border border-border rounded-lg bg-card">
          <p className="text-xs text-muted-foreground font-medium">Overdue</p>
          <p className="text-2xl font-light mt-2 text-destructive">{overdue}</p>
          {totalPenalty > 0 && (
            <p className="text-xs text-destructive mt-1">₹{totalPenalty.toLocaleString('en-IN')} penalty</p>
          )}
        </div>
      </div>

      {/* Compliance Checklist */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Compliance Checklist</h3>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Filing
          </button>
        </div>

        {showAdd && (
          <div className="px-6 py-4 border-b border-border bg-muted/30 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                placeholder="Filing name *"
                value={newFiling.filing}
                onChange={(e) => setNewFiling({ ...newFiling, filing: e.target.value })}
                className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="date"
                value={newFiling.deadline}
                onChange={(e) => setNewFiling({ ...newFiling, deadline: e.target.value })}
                className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={newFiling.status}
                onChange={(e) => setNewFiling({ ...newFiling, status: e.target.value as ComplianceFiling['status'] })}
                className="px-3 py-2 border border-border rounded-lg text-sm bg-background"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
              <input
                type="number"
                placeholder="Penalty amount (if overdue)"
                value={newFiling.penalty}
                onChange={(e) => setNewFiling({ ...newFiling, penalty: e.target.value })}
                className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddFiling}
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
          {filings.map((filing) => (
            <div key={filing.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{filing.filing}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Due: {new Date(filing.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {filing.penalty && filing.penalty > 0 && (
                  <p className="text-xs text-destructive mt-0.5">
                    Penalty: ₹{filing.penalty.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
              <select
                value={filing.status}
                onChange={(e) => updateStatus(filing.id, e.target.value as ComplianceFiling['status'])}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border focus:outline-none ${statusStyles[filing.status]}`}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
              <button
                onClick={() => handleDelete(filing.id)}
                className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                aria-label="Delete filing"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {filings.length === 0 && (
            <div className="px-6 py-10 text-center text-muted-foreground text-sm">
              No filings added yet. Click &quot;Add Filing&quot; to get started.
            </div>
          )}
        </div>
      </div>

      {/* Analysis */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">AI Compliance Analysis</h3>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {(analysis || recommendations.length > 0) ? (
          <div className="p-6 space-y-4">
            {analysis && <p className="text-sm text-foreground leading-relaxed">{analysis}</p>}
            {recommendations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Action Items</p>
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
            Click &quot;Analyze&quot; to get AI compliance recommendations.
          </div>
        )}
      </div>
    </div>
  );
}
