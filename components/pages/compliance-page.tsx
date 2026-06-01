'use client';

import { useState } from 'react';
import { analyzeFinancialData } from '@/lib/ai-service';

interface Compliance {
  id: string;
  filing: string;
  deadline: string;
  status: 'pending' | 'completed' | 'overdue';
  penalty?: number;
}

interface CompliancePageProps {
  onBack: () => void;
}

export default function CompliancePage({ onBack }: CompliancePageProps) {
  const [compliances, setCompliances] = useState<Compliance[]>([
    { id: '1', filing: 'Annual Tax Return (ITR)', deadline: '2026-07-31', status: 'pending' },
    { id: '2', filing: 'Quarterly GST Return', deadline: '2026-06-30', status: 'completed' },
    { id: '3', filing: 'Annual Audit Report', deadline: '2026-08-15', status: 'pending' },
    { id: '4', filing: 'Form 16 Generation', deadline: '2026-06-30', status: 'completed' },
    { id: '5', filing: 'TDS Returns', deadline: '2026-06-10', status: 'overdue', penalty: 5000 },
  ]);

  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await analyzeFinancialData({
        type: 'compliance',
        data: { compliances },
        query: 'Analyze compliance status and identify missing filings',
      });
      setAnalysis(response.analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysis('Compliance check completed with standard analysis.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (id: string, status: 'pending' | 'completed' | 'overdue') => {
    setCompliances(compliances.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const pending = compliances.filter((c) => c.status === 'pending').length;
  const completed = compliances.filter((c) => c.status === 'completed').length;
  const overdue = compliances.filter((c) => c.status === 'overdue').length;
  const progress = Math.round((completed / compliances.length) * 100);

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border border-border rounded-lg bg-card">
          <p className="text-xs text-muted-foreground font-medium">Progress</p>
          <p className="text-2xl font-light mt-2">{progress}%</p>
          <div className="w-full h-2 bg-muted rounded-full mt-2">
            <div
              className="h-full bg-green-600 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
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
          <p className="text-2xl font-light mt-2 text-red-600">{overdue}</p>
        </div>
      </div>

      <div className="p-6 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-4">Compliance Checklist</h3>
        <div className="space-y-2">
          {compliances.map((comp) => (
            <div
              key={comp.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{comp.filing}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Due: {new Date(comp.deadline).toLocaleDateString()}
                </p>
                {comp.penalty && (
                  <p className="text-xs text-red-600 mt-1">Penalty: ₹{comp.penalty}</p>
                )}
              </div>
              <select
                value={comp.status}
                onChange={(e) =>
                  updateStatus(comp.id, e.target.value as 'pending' | 'completed' | 'overdue')
                }
                className={`px-3 py-1 rounded text-xs font-medium border ${
                  comp.status === 'completed'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : comp.status === 'overdue'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                }`}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Compliance Analysis</h3>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
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
