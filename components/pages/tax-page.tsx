'use client';

import { useState, useEffect } from 'react';
import { analyzeFinancialData } from '@/lib/ai-service';
import { getAppState, saveAppState } from '@/lib/app-state';

interface TaxPageProps {
  onBack: () => void;
}

export default function TaxPage({ onBack }: TaxPageProps) {
  const [formData, setFormData] = useState({
    grossIncome: '',
    deductions: '',
    gstSales: '',
    gstPurchases: '',
    tdsCollected: '',
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const state = getAppState();
    if (state.tax.grossIncome > 0) {
      setFormData({
        grossIncome: String(state.tax.grossIncome),
        deductions: String(state.tax.deductions),
        gstSales: String(state.tax.gstCollected),
        gstPurchases: String(state.tax.gstPaid),
        tdsCollected: String(state.tax.tdsAmount),
      });
    }
  }, []);

  const calculateTax = async () => {
    if (!formData.grossIncome) {
      alert('Please enter gross income');
      return;
    }

    setLoading(true);
    try {
      const grossIncome = parseFloat(formData.grossIncome) || 0;
      const deductions = parseFloat(formData.deductions) || 0;
      const gstSales = parseFloat(formData.gstSales) || 0;
      const gstPurchases = parseFloat(formData.gstPurchases) || 0;
      const tdsCollected = parseFloat(formData.tdsCollected) || 0;

      const taxableIncome = Math.max(0, grossIncome - deductions);
      const incomeTax = taxableIncome * 0.3;
      const gstLiability = Math.max(0, (gstSales - gstPurchases) * 0.18);
      const netTaxDue = Math.max(0, incomeTax + gstLiability - tdsCollected);

      const response = await analyzeFinancialData({
        type: 'tax',
        data: { grossIncome, deductions, taxableIncome, incomeTax, gstLiability, tdsCollected },
        query: 'Provide tax optimization recommendations',
      });

      const state = getAppState();
      state.tax = {
        grossIncome,
        deductions,
        taxableIncome,
        taxLiability: netTaxDue,
        gstCollected: gstSales,
        gstPaid: gstPurchases,
        netGST: gstLiability,
        tdsAmount: tdsCollected,
      };
      saveAppState(state);

      setResults({
        taxableIncome,
        incomeTax: incomeTax.toFixed(2),
        gstLiability: gstLiability.toFixed(2),
        tdsAdjustment: tdsCollected,
        netTaxDue: netTaxDue.toFixed(2),
        aiAnalysis: response.analysis,
        recommendations: response.recommendations,
      });
    } catch (error) {
      console.error('[v0] Tax calculation failed:', error);
      setResults({ error: 'Calculation service unavailable' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light tracking-tight">Tax Planning</h2>
          <p className="text-muted-foreground text-sm mt-1">Income Tax, GST &amp; TDS Analysis</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors">
          Back
        </button>
      </div>

      <div className="p-6 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-4">Tax Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Gross Income</label>
            <input
              type="number"
              value={formData.grossIncome}
              onChange={(e) => setFormData({ ...formData, grossIncome: e.target.value })}
              className="w-full mt-2 px-3 py-2 border border-border rounded-lg text-sm bg-background"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Deductions</label>
            <input
              type="number"
              value={formData.deductions}
              onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
              className="w-full mt-2 px-3 py-2 border border-border rounded-lg text-sm bg-background"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium">GST Sales</label>
            <input
              type="number"
              value={formData.gstSales}
              onChange={(e) => setFormData({ ...formData, gstSales: e.target.value })}
              className="w-full mt-2 px-3 py-2 border border-border rounded-lg text-sm bg-background"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium">GST Purchases</label>
            <input
              type="number"
              value={formData.gstPurchases}
              onChange={(e) => setFormData({ ...formData, gstPurchases: e.target.value })}
              className="w-full mt-2 px-3 py-2 border border-border rounded-lg text-sm bg-background"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium">TDS Collected</label>
            <input
              type="number"
              value={formData.tdsCollected}
              onChange={(e) => setFormData({ ...formData, tdsCollected: e.target.value })}
              className="w-full mt-2 px-3 py-2 border border-border rounded-lg text-sm bg-background"
              placeholder="0"
            />
          </div>
        </div>
        <button
          onClick={calculateTax}
          disabled={loading}
          className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
        >
          {loading ? 'Calculating...' : 'Calculate Tax'}
        </button>
      </div>

      {results && !results.error && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground font-medium">Taxable Income</p>
              <p className="text-2xl font-light mt-1">₹{results.taxableIncome?.toFixed(0)}</p>
            </div>
            <div className="p-4 border border-border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground font-medium">Income Tax (30%)</p>
              <p className="text-2xl font-light mt-1 text-red-600">₹{results.incomeTax}</p>
            </div>
            <div className="p-4 border border-border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground font-medium">GST Liability</p>
              <p className="text-2xl font-light mt-1 text-red-600">₹{results.gstLiability}</p>
            </div>
            <div className="p-4 border border-border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground font-medium">TDS Adjustment</p>
              <p className="text-2xl font-light mt-1 text-green-600">
                -₹{results.tdsAdjustment?.toFixed(0)}
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg bg-card lg:col-span-2">
              <p className="text-xs text-muted-foreground font-medium">Net Tax Due</p>
              <p className="text-2xl font-light mt-1 text-red-600">₹{results.netTaxDue}</p>
            </div>
          </div>

          {results.aiAnalysis && (
            <div className="p-6 border border-border rounded-lg bg-blue-50/50">
              <h4 className="font-semibold text-sm mb-2">AI Tax Analysis</h4>
              <p className="text-sm text-blue-900">{results.aiAnalysis}</p>
            </div>
          )}

          {results.recommendations && results.recommendations.length > 0 && (
            <div className="p-6 border border-border rounded-lg bg-card">
              <h4 className="font-semibold text-sm mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {results.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {results?.error && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-sm text-red-700">{results.error}</p>
        </div>
      )}
    </div>
  );
}
