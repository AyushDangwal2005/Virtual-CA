'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { analyzeFinancialData } from '@/lib/ai-service';
import { getAppState, saveAppState } from '@/lib/app-state';

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  account: string;
  debit: number;
  credit: number;
}

interface BookkeepingPageProps {
  onBack: () => void;
}

export default function BookkeepingPage({ onBack }: BookkeepingPageProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    account: 'Cash',
    debit: '',
    credit: '',
  });

  useEffect(() => {
    const state = getAppState();
    setEntries(
      state.bookkeeping.entries.map((e: any, idx: number) => ({
        id: String(idx),
        ...e,
      }))
    );
    setTotalDebit(state.bookkeeping.totalDebit);
    setTotalCredit(state.bookkeeping.totalCredit);
  }, []);

  const calculateBalance = () => totalDebit - totalCredit;

  const handleAddEntry = () => {
    if (!formData.description || (!formData.debit && !formData.credit)) {
      alert('Please fill description and amount');
      return;
    }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: formData.date,
      description: formData.description,
      account: formData.account,
      debit: parseFloat(formData.debit || '0'),
      credit: parseFloat(formData.credit || '0'),
    };

    const newEntries = [...entries, newEntry];
    const newDebit = totalDebit + newEntry.debit;
    const newCredit = totalCredit + newEntry.credit;

    setEntries(newEntries);
    setTotalDebit(newDebit);
    setTotalCredit(newCredit);

    const state = getAppState();
    state.bookkeeping.entries = newEntries;
    state.bookkeeping.totalDebit = newDebit;
    state.bookkeeping.totalCredit = newCredit;
    state.bookkeeping.balance = calculateBalance();
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
    saveAppState(state);
  };

  const handleAnalyze = async () => {
    if (entries.length === 0) {
      alert('Add entries first');
      return;
    }
    setLoading(true);
    try {
      const result = await analyzeFinancialData({
        type: 'bookkeeping',
        data: { entries, totalDebit, totalCredit },
        query: 'Check for double-entry errors and compliance',
      });
      setAnalysis(result.analysis);
    } catch (error) {
      console.error('[v0] Analysis failed:', error);
      setAnalysis('Analysis service unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light">Bookkeeping</h2>
          <p className="text-muted-foreground text-sm mt-1">Journal Entries &amp; Trial Balance</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors">
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 border border-border rounded-lg bg-card space-y-4">
          <h3 className="font-semibold">Add Journal Entry</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="col-span-2 px-3 py-2 border border-border rounded-lg bg-background text-sm"
            />
            <input
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="col-span-2 px-3 py-2 border border-border rounded-lg bg-background text-sm"
            />
            <select
              value={formData.account}
              onChange={(e) => setFormData({ ...formData, account: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
            >
              <option>Cash</option>
              <option>Bank</option>
              <option>Revenue</option>
              <option>Expenses</option>
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Debit"
                value={formData.debit}
                onChange={(e) => setFormData({ ...formData, debit: e.target.value, credit: '' })}
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm"
              />
              <input
                type="number"
                placeholder="Credit"
                value={formData.credit}
                onChange={(e) => setFormData({ ...formData, credit: e.target.value, debit: '' })}
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleAddEntry}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:opacity-90 flex items-center justify-center gap-2 text-sm font-medium transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>

        <div className="p-6 border border-border rounded-lg bg-card space-y-4">
          <h3 className="font-semibold">Trial Balance</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Debit:</span>
              <span className="font-medium">₹{totalDebit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Credit:</span>
              <span className="font-medium">₹{totalCredit.toLocaleString()}</span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance:</span>
                <span
                  className={`font-semibold ${
                    calculateBalance() === 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ₹{calculateBalance().toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              {calculateBalance() === 0 ? '✓ Balanced' : '⚠ Unbalanced - Check entries'}
            </p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-secondary text-secondary-foreground py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium transition-opacity"
          >
            {loading ? 'Analyzing...' : 'AI Analysis'}
          </button>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="p-6 border border-border rounded-lg bg-card overflow-x-auto">
          <h3 className="font-semibold mb-4">Journal Entries ({entries.length})</h3>
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-muted-foreground">
                <th className="pb-2">Date</th>
                <th className="pb-2">Description</th>
                <th className="pb-2">Account</th>
                <th className="pb-2 text-right">Debit</th>
                <th className="pb-2 text-right">Credit</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="py-3">{entry.date}</td>
                  <td className="py-3">{entry.description}</td>
                  <td className="py-3 text-muted-foreground text-xs">{entry.account}</td>
                  <td className="py-3 text-right">
                    {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 text-right">
                    {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-600 hover:text-red-700"
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
      )}

      {analysis && (
        <div className="p-6 border border-border rounded-lg bg-card space-y-2">
          <h3 className="font-semibold">AI Analysis</h3>
          <p className="text-sm text-foreground">{analysis}</p>
        </div>
      )}
    </div>
  );
}
