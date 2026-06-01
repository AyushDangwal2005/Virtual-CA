'use client';

import { useState, useEffect } from 'react';
import { analyzeFinancialData } from '@/lib/ai-service';
import { getAppState, saveAppState } from '@/lib/app-state';

interface TaxPageProps {
  onBack: () => void;
}

interface TaxResults {
  taxableIncome: number;
  incomeTax: number;
  surcharge: number;
  cess: number;
  gstLiability: number;
  tdsAdjustment: number;
  netTaxDue: number;
  aiAnalysis: string;
  recommendations: string[];
}

export default function TaxPage({ onBack }: TaxPageProps) {
  const [formData, setFormData] = useState({
    grossIncome: '',
    deductions: '',
    gstSales: '',
    gstPurchases: '',
    tdsCollected: '',
    regime: 'new' as 'new' | 'old',
  });
  const [results, setResults] = useState<TaxResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const state = getAppState();
    if (state.tax.grossIncome > 0) {
      setFormData((prev) => ({
        ...prev,
        grossIncome: String(state.tax.grossIncome),
        deductions: String(state.tax.deductions),
        gstSales: String(state.tax.gstCollected),
        gstPurchases: String(state.tax.gstPaid),
        tdsCollected: String(state.tax.tdsAmount),
      }));
    }
  }, []);

  const calculateTax = async () => {
    setError('');
    if (!formData.grossIncome) {
      setError('Gross Income is required.');
      return;
    }

    const grossIncome = parseFloat(formData.grossIncome) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    const gstSales = parseFloat(formData.gstSales) || 0;
    const gstPurchases = parseFloat(formData.gstPurchases) || 0;
    const tdsCollected = parseFloat(formData.tdsCollected) || 0;

    setLoading(true);
    setResults(null);

    const taxableIncome = Math.max(0, grossIncome - deductions);

    // New Tax Regime slabs (FY 2024-25 onward)
    let incomeTax = 0;
    if (formData.regime === 'new') {
      if (taxableIncome <= 300000) incomeTax = 0;
      else if (taxableIncome <= 600000) incomeTax = (taxableIncome - 300000) * 0.05;
      else if (taxableIncome <= 900000) incomeTax = 15000 + (taxableIncome - 600000) * 0.1;
      else if (taxableIncome <= 1200000) incomeTax = 45000 + (taxableIncome - 900000) * 0.15;
      else if (taxableIncome <= 1500000) incomeTax = 90000 + (taxableIncome - 1200000) * 0.2;
      else incomeTax = 150000 + (taxableIncome - 1500000) * 0.3;
    } else {
      // Old Tax Regime slabs
      if (taxableIncome <= 250000) incomeTax = 0;
      else if (taxableIncome <= 500000) incomeTax = (taxableIncome - 250000) * 0.05;
      else if (taxableIncome <= 1000000) incomeTax = 12500 + (taxableIncome - 500000) * 0.2;
      else incomeTax = 112500 + (taxableIncome - 1000000) * 0.3;
    }

    const surcharge = taxableIncome > 5000000 ? incomeTax * 0.1 : 0;
    const cess = (incomeTax + surcharge) * 0.04;
    const totalIncomeTax = incomeTax + surcharge + cess;

    const gstLiability = Math.max(0, (gstSales - gstPurchases) * 0.18);
    const netTaxDue = Math.max(0, totalIncomeTax + gstLiability - tdsCollected);

    try {
      const response = await analyzeFinancialData({
        type: 'tax',
        data: {
          grossIncome,
          deductions,
          taxableIncome,
          incomeTax: totalIncomeTax,
          gstLiability,
          tdsCollected,
          netTaxDue,
          regime: formData.regime,
        },
        query: 'Provide tax optimization recommendations for Indian taxation',
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
        incomeTax: totalIncomeTax,
        surcharge,
        cess,
        gstLiability,
        tdsAdjustment: tdsCollected,
        netTaxDue,
        aiAnalysis: response.analysis,
        recommendations: response.recommendations,
      });
    } catch {
      setError('Calculation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light tracking-tight">Tax Planning</h2>
          <p className="text-muted-foreground text-sm mt-1">Income Tax, GST &amp; TDS Analysis</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
        >
          Back
        </button>
      </div>

      <div className="p-6 border border-border rounded-lg bg-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Tax Parameters</h3>
          <div className="flex gap-1 p-1 bg-muted rounded-lg text-xs font-medium">
            <button
              onClick={() => setFormData({ ...formData, regime: 'new' })}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                formData.regime === 'new'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              New Regime
            </button>
            <button
              onClick={() => setFormData({ ...formData, regime: 'old' })}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                formData.regime === 'old'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Old Regime
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Gross Income (Annual)', key: 'grossIncome', required: true },
            { label: 'Deductions (80C, 80D, HRA, etc.)', key: 'deductions', required: false },
            { label: 'GST Sales (Taxable Turnover)', key: 'gstSales', required: false },
            { label: 'GST Purchases (Input Credit)', key: 'gstPurchases', required: false },
            { label: 'TDS Already Deducted', key: 'tdsCollected', required: false },
          ].map(({ label, key, required }) => (
            <div key={key}>
              <label className="text-sm font-medium">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  value={formData[key as keyof typeof formData]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          onClick={calculateTax}
          disabled={loading}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
        >
          {loading ? 'Calculating...' : 'Calculate Tax Liability'}
        </button>
      </div>

      {results && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground font-medium">Taxable Income</p>
              <p className="text-xl font-light mt-1">{fmt(results.taxableIncome)}</p>
            </div>
            <div className="p-4 border border-border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground font-medium">Income Tax</p>
              <p className="text-xl font-light mt-1">{fmt(results.incomeTax)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">incl. surcharge &amp; cess</p>
            </div>
            <div className="p-4 border border-border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground font-medium">GST Liability</p>
              <p className="text-xl font-light mt-1">{fmt(results.gstLiability)}</p>
            </div>
            <div className="p-4 border border-border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground font-medium">TDS Deducted</p>
              <p className="text-xl font-light mt-1 text-green-600">
                -{fmt(results.tdsAdjustment)}
              </p>
            </div>
          </div>

          <div className="p-5 border-2 border-primary/30 rounded-lg bg-card flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Net Tax Due</p>
              <p className="text-3xl font-light mt-1">{fmt(results.netTaxDue)}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Regime: {formData.regime === 'new' ? 'New' : 'Old'}</p>
              <p className="mt-1">FY 2025-26</p>
            </div>
          </div>

          {results.aiAnalysis && (
            <div className="p-5 border border-border rounded-lg bg-card space-y-3">
              <h4 className="font-semibold text-sm">AI Tax Analysis</h4>
              <p className="text-sm text-foreground leading-relaxed">{results.aiAnalysis}</p>
              {results.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Recommendations
                  </p>
                  <ul className="space-y-2">
                    {results.recommendations.map((rec, i) => (
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
      )}
    </div>
  );
}
