'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { analyzeFinancialData } from '@/lib/ai-service';
import { getAppState, saveAppState, type JournalEntry } from '@/lib/app-state';

interface BookkeepingPageProps {
  onBack: () => void;
}

const ACCOUNTS = ['Cash', 'Bank', 'Revenue', 'Expenses', 'Assets', 'Liabilities', 'Capital', 'GST Payable'];

export default function BookkeepingPage({ onBack }: BookkeepingPageProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    account: 'Cash',
    debit: '',
    credit: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const state = getAppState();
    setEntries(state.bookkeeping.entries);
    setTotalDebit(state.bookkeeping.totalDebit);
    setTotalCredit(state.bookkeeping.totalCredit);
  }, []);

  const balance = totalDebit - totalCredit;

  const handleAddEntry = () => {
    setFormError('');
    if (!formData.description.trim()) {
      setFormError('Description is required.');
      return;
    }
    const debit = parseFloat(formData.debit || '0');
    const credit = parseFloat(formData.credit || '0');
    if (debit === 0 && credit === 0) {
      setFormError('Enter a debit or credit amount.');
      return;
    }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: formData.date,
      description: formData.description.trim(),
      account: formData.account,
      debit,
      credit,
    };

    const newEntries = [...entries, newEntry];
    const newDebit = totalDebit + debit;
    const newCredit = totalCredit + credit;
    const newBalance = newDebit - newCredit;

    setEntries(newEntries);
    setTotalDebit(newDebit);
    setTotalCredit(newCredit);

    const state = getAppState();
    state.bookkeeping.entries = newEntries;
    state.bookkeeping.totalDebit = newDebit;
    state.bookkeeping.totalCredit = newCredit;
    state.bookkeeping.balance = newBalance;
    // Sync audit transaction count from bookkeeping entries
    state.audit.transactionCount = newEntries.length;
    state.audit.verifiedCount = Math.max(state.audit.verifiedCount, newEntries.length);
    saveAppState(state);

    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      account: 'Cash',
      debit: '',
      credit: '',
    });
  };

  const handleDeleteEntry = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;

    const newEntries = entries.filter((e) => e.id !== id);
    const newDebit = totalDebit - entry.debit;
    const newCredit = totalCredit - entry.credit;

    setEntries(newEntries);
    setTotalDebit(newDebit);
    setTotalCredit(newCredit);

    const state = getAppState();
    state.bookkeeping.entries = newEntries;
    state.bookkeeping.totalDebit = newDebit;
    state.bookkeeping.totalCredit = newCredit;
    state.bookkeeping.balance = newDebit - newCredit;
    state.audit.transactionCount = newEntries.length;
    state.audit.verifiedCount = Math.min(state.audit.verifiedCount, newEntries.length);
    saveAppState(state);
  };

  const handleAnalyze = async () => {
    if (entries.length === 0) {
      setFormError('Add at least one entry before running analysis.');
      return;
    }
    setFormError('');
    setLoading(true);
    setAnalysis('');
    setRecommendations([]);
    try {
      const result = await analyzeFinancialData({
        type: 'bookkeeping',
        data: { entries, totalDebit, totalCredit, balance },
        query: 'Check for double-entry errors, account classification, and compliance issues',
      });
      setAnalysis(result.analysis);
      setRecommendations(result.recommendations);
    } catch {
      setAnalysis('Analysis service temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light tracking-tight">Bookkeeping</h2>
          <p className="text-muted-foreground text-sm mt-1">Journal Entries &amp; Trial Balance</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-2 p-6 border border-border rounded-lg bg-card space-y-4">
          <h3 className="font-semibold">Add Journal Entry</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="col-span-2 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              placeholder="Description *"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="col-span-2 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              value={formData.account}
              onChange={(e) => setFormData({ ...formData, account: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ACCOUNTS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                placeholder="Debit (Dr)"
                value={formData.debit}
                onChange={(e) =>
                  setFormData({ ...formData, debit: e.target.value, credit: '' })
                }
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="number"
                min="0"
                placeholder="Credit (Cr)"
                value={formData.credit}
                onChange={(e) =>
                  setFormData({ ...formData, credit: e.target.value, debit: '' })
                }
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}
          <button
            onClick={handleAddEntry}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg hover:opacity-90 flex items-center justify-center gap-2 text-sm font-medium transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>

        {/* Trial Balance */}
        <div className="p-6 border border-border rounded-lg bg-card space-y-4">
          <h3 className="font-semibold">Trial Balance</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Total Debit (Dr)</span>
              <span className="font-semibold">₹{totalDebit.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Total Credit (Cr)</span>
              <span className="font-semibold">₹{totalCredit.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-medium">Net Balance</span>
              <span
                className={`font-bold text-lg ${
                  balance === 0 ? 'text-green-600' : 'text-destructive'
                }`}
              >
                ₹{balance.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              {entries.length === 0
                ? 'No entries yet'
                : balance === 0
                ? 'Trial balance is balanced'
                : 'Warning: Trial balance is unbalanced'}
            </p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || entries.length === 0}
            className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-lg hover:opacity-80 disabled:opacity-40 text-sm font-medium transition-opacity border border-border"
          >
            {loading ? 'Analyzing...' : 'AI Analysis'}
          </button>
        </div>
      </div>

      {/* Entries Table */}
      {entries.length > 0 && (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold">Journal Entries ({entries.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{entry.date}</td>
                    <td className="px-4 py-3 font-medium">{entry.description}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                        {entry.account}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Analysis Result */}
      {(analysis || recommendations.length > 0) && (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold">AI Analysis</h3>
          </div>
          <div className="p-6 space-y-4">
            {analysis && (
              <p className="text-sm text-foreground leading-relaxed">{analysis}</p>
            )}
            {recommendations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Recommendations
                </p>
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
