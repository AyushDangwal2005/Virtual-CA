'use client';

import { useState, useEffect, useCallback } from 'react';
import { Menu, X, LayoutDashboard, BookOpen, Calculator, ShieldCheck, Search, AlertTriangle, TrendingUp, Briefcase } from 'lucide-react';
import { getAppState, computeDashboardMetrics } from '@/lib/app-state';
import BookkeepingPage from '@/components/pages/bookkeeping-page';
import TaxPage from '@/components/pages/tax-page';
import CompliancePage from '@/components/pages/compliance-page';
import AuditPage from '@/components/pages/audit-page';
import RiskPage from '@/components/pages/risk-page';
import ForecastPage from '@/components/pages/forecast-page';
import CFOPage from '@/components/pages/cfo-page';

type PageType =
  | 'dashboard'
  | 'bookkeeping'
  | 'tax'
  | 'compliance'
  | 'audit'
  | 'risk'
  | 'forecast'
  | 'cfo';

interface Department {
  id: PageType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const DEPARTMENTS: Department[] = [
  { id: 'bookkeeping', label: 'Bookkeeping', description: 'Journal entries and trial balance', icon: BookOpen },
  { id: 'tax', label: 'Tax Planning', description: 'Income tax, GST and TDS analysis', icon: Calculator },
  { id: 'compliance', label: 'Compliance', description: 'Filing deadlines and regulatory status', icon: ShieldCheck },
  { id: 'audit', label: 'Audit', description: 'Transaction verification and readiness', icon: Search },
  { id: 'risk', label: 'Risk Analytics', description: 'Cash flow and concentration risk', icon: AlertTriangle },
  { id: 'forecast', label: 'Forecasting', description: 'Revenue projections and scenarios', icon: TrendingUp },
  { id: 'cfo', label: 'CFO Decisions', description: 'Strategic financial recommendations', icon: Briefcase },
];

interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  taxLiability: number;
  auditScore: number;
  riskLevel: string;
  completionRate: number;
}

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    taxLiability: 0,
    auditScore: 0,
    riskLevel: 'No Data',
    completionRate: 0,
  });
  const [entryCount, setEntryCount] = useState(0);

  const refreshMetrics = useCallback(() => {
    const state = getAppState();
    const computed = computeDashboardMetrics(state);
    setMetrics({
      totalRevenue: computed.totalRevenue,
      totalExpenses: computed.totalExpenses,
      taxLiability: computed.taxLiability,
      auditScore: computed.auditScore,
      riskLevel: computed.riskLevel,
      completionRate: computed.completionRate,
    });
    setEntryCount(state.bookkeeping.entries.length);
  }, []);

  useEffect(() => {
    setMounted(true);
    refreshMetrics();
  }, [refreshMetrics]);

  const goToDashboard = useCallback(() => {
    setCurrentPage('dashboard');
    setSidebarOpen(false);
    refreshMetrics();
  }, [refreshMetrics]);

  const navigate = useCallback((page: PageType) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading Virtual CA...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '₹0';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const riskTextColor = (level: string) => {
    if (level === 'High') return 'text-destructive';
    if (level === 'Medium') return 'text-yellow-600';
    if (level === 'Low') return 'text-green-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-card/95 backdrop-blur-sm flex items-center px-4 sm:px-6 gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-1.5 hover:bg-muted rounded-lg transition-colors"
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <button onClick={goToDashboard} className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground text-xs font-bold">CA</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-none">Virtual CA</p>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">Mind OS</p>
          </div>
        </button>

        <div className="flex-1" />

        {currentPage !== 'dashboard' && (
          <button
            onClick={goToDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium hover:bg-muted rounded-lg transition-colors border border-border"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Sidebar */}
        <aside
          className={`
            fixed top-14 bottom-0 left-0 z-30 w-56 bg-card border-r border-border overflow-y-auto flex flex-col transition-transform duration-200
            lg:static lg:top-auto lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          aria-label="Main navigation"
        >
          <nav className="p-3 flex-1">
            <button
              onClick={goToDashboard}
              className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
                currentPage === 'dashboard'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              Dashboard
            </button>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 mt-2">
              Departments
            </p>

            {DEPARTMENTS.map((dept) => {
              const Icon = dept.icon;
              return (
                <button
                  key={dept.id}
                  onClick={() => navigate(dept.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-0.5 ${
                    currentPage === dept.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {dept.label}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-border">
            <div className="px-3 py-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">{entryCount} entries</p>
              <p className="mt-0.5">{DEPARTMENTS.length} modules active</p>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-14 z-20 bg-foreground/20 lg:hidden"
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto lg:ml-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
            {currentPage === 'dashboard' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-light tracking-tight text-balance">
                    Executive Dashboard
                  </h2>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    Live financial overview computed from actual department data.
                  </p>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 border border-border rounded-lg bg-card">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Revenue</p>
                    <p className="text-2xl font-light mt-2 text-balance">
                      {formatCurrency(metrics.totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {metrics.totalRevenue === 0 ? 'Add bookkeeping entries' : `${entryCount} journal entries`}
                    </p>
                  </div>
                  <div className="p-5 border border-border rounded-lg bg-card">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Tax Liability</p>
                    <p className="text-2xl font-light mt-2">
                      {formatCurrency(metrics.taxLiability)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {metrics.taxLiability === 0 ? 'Run tax module' : 'Current liability'}
                    </p>
                  </div>
                  <div className="p-5 border border-border rounded-lg bg-card">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Audit Score</p>
                    <p className={`text-2xl font-light mt-2 ${metrics.auditScore >= 85 ? 'text-green-600' : metrics.auditScore >= 60 ? 'text-yellow-600' : metrics.auditScore > 0 ? 'text-destructive' : ''}`}>
                      {metrics.auditScore > 0 ? `${metrics.auditScore}/100` : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {metrics.auditScore === 0 ? 'Run audit module' : metrics.auditScore >= 85 ? 'Excellent' : 'Needs review'}
                    </p>
                  </div>
                  <div className="p-5 border border-border rounded-lg bg-card">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Risk Level</p>
                    <p className={`text-2xl font-light mt-2 ${riskTextColor(metrics.riskLevel)}`}>
                      {metrics.riskLevel}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {metrics.completionRate > 0 ? `${metrics.completionRate}% compliance` : 'Real-time assessment'}
                    </p>
                  </div>
                </div>

                {/* Department Grid + System Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 border border-border rounded-lg bg-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                      <h3 className="font-semibold">Departments</h3>
                    </div>
                    <div className="divide-y divide-border">
                      {DEPARTMENTS.map((dept) => {
                        const Icon = dept.icon;
                        return (
                          <button
                            key={dept.id}
                            onClick={() => navigate(dept.id)}
                            className="w-full text-left px-6 py-4 hover:bg-muted/40 transition-colors flex items-center gap-4 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{dept.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{dept.description}</p>
                            </div>
                            <span className="text-muted-foreground group-hover:text-primary transition-colors text-lg leading-none">
                              &rarr;
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border border-border rounded-lg bg-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                      <h3 className="font-semibold">System Status</h3>
                    </div>
                    <div className="p-5 space-y-3">
                      {[
                        { label: 'Journal Entries', value: String(entryCount), highlight: false },
                        { label: 'AI Engine', value: 'Active', highlight: true },
                        { label: 'Data Store', value: 'Local', highlight: false },
                        { label: 'Modules', value: `${DEPARTMENTS.length} Active`, highlight: false },
                        { label: 'Compliance', value: `${metrics.completionRate}%`, highlight: false },
                      ].map(({ label, value, highlight }) => (
                        <div key={label} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{label}</span>
                          <span className={`text-xs font-semibold ${highlight ? 'text-green-600' : 'text-foreground'}`}>
                            {value}
                          </span>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-border">
                        <button
                          onClick={refreshMetrics}
                          className="w-full text-center py-2 text-xs font-medium hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        >
                          Refresh Metrics
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Start guide if no data */}
                {entryCount === 0 && (
                  <div className="p-6 border border-dashed border-border rounded-lg bg-card/50 text-center space-y-3">
                    <p className="font-medium text-sm">Get started with Virtual CA</p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Begin by adding journal entries in Bookkeeping, then use each module to generate AI-powered
                      financial insights across Tax, Compliance, Audit, Risk, Forecasting, and CFO decisions.
                    </p>
                    <button
                      onClick={() => navigate('bookkeeping')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <BookOpen className="w-4 h-4" />
                      Open Bookkeeping
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentPage === 'bookkeeping' && <BookkeepingPage onBack={goToDashboard} />}
            {currentPage === 'tax' && <TaxPage onBack={goToDashboard} />}
            {currentPage === 'compliance' && <CompliancePage onBack={goToDashboard} />}
            {currentPage === 'audit' && <AuditPage onBack={goToDashboard} />}
            {currentPage === 'risk' && <RiskPage onBack={goToDashboard} />}
            {currentPage === 'forecast' && <ForecastPage onBack={goToDashboard} />}
            {currentPage === 'cfo' && <CFOPage onBack={goToDashboard} />}
          </div>
        </main>
      </div>
    </div>
  );
}
