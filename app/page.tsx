'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Home } from 'lucide-react';
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

const DEPARTMENTS: { id: PageType; label: string; description: string }[] = [
  { id: 'bookkeeping', label: 'Bookkeeping', description: 'Journal entries & trial balance' },
  { id: 'tax', label: 'Tax Planning', description: 'Income tax, GST & TDS analysis' },
  { id: 'compliance', label: 'Compliance', description: 'Filing deadlines & regulatory status' },
  { id: 'audit', label: 'Audit', description: 'Transaction verification & readiness' },
  { id: 'risk', label: 'Risk Analytics', description: 'Cash flow & concentration risk' },
  { id: 'forecast', label: 'Forecasting', description: 'Revenue projections & scenarios' },
  { id: 'cfo', label: 'CFO Decisions', description: 'Strategic financial recommendations' },
];

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    taxLiability: 0,
    auditScore: 0,
    riskLevel: 'No Data',
  });
  const [entryCount, setEntryCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    refreshMetrics();
  }, []);

  const refreshMetrics = () => {
    const state = getAppState();
    const computed = computeDashboardMetrics(state);
    setMetrics({
      totalRevenue: computed.totalRevenue,
      totalExpenses: computed.totalExpenses,
      taxLiability: computed.taxLiability,
      auditScore: computed.auditScore,
      riskLevel: computed.riskLevel,
    });
    setEntryCount(state.bookkeeping.entries.length);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading Virtual CA Mind OS...</p>
        </div>
      </div>
    );
  }

  const goToDashboard = () => {
    setCurrentPage('dashboard');
    setSidebarOpen(false);
    refreshMetrics();
  };

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '₹0';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString()}`;
  };

  const getRiskColor = (level: string) => {
    if (level === 'High') return 'text-red-600';
    if (level === 'Medium') return 'text-yellow-600';
    if (level === 'Low') return 'text-green-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            onClick={goToDashboard}
            className="flex items-center gap-2 hover:opacity-75 transition-opacity"
          >
            <div>
              <h1 className="text-xl sm:text-2xl font-light tracking-tight">Virtual CA</h1>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">
                Financial Intelligence
              </p>
            </div>
          </button>

          {currentPage !== 'dashboard' && (
            <button
              onClick={goToDashboard}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors ml-auto"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — mobile overlay + desktop permanent */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border overflow-y-auto transition-transform duration-200
            lg:static lg:translate-x-0 lg:flex lg:flex-col
            ${sidebarOpen ? 'translate-x-0 top-[65px]' : '-translate-x-full lg:translate-x-0'}
          `}
          aria-label="Navigation"
        >
          <nav className="p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2">
              Departments
            </p>
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                onClick={() => {
                  setCurrentPage(dept.id);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  currentPage === dept.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {dept.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Overlay to close sidebar on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 lg:hidden"
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {currentPage === 'dashboard' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-light tracking-tight text-balance">
                    Executive Dashboard
                  </h2>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    Real-time financial overview from actual department data
                  </p>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-6 border border-border rounded-lg bg-card">
                    <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                    <p className="text-3xl font-light mt-2">
                      {formatCurrency(metrics.totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {metrics.totalRevenue === 0 ? 'Add bookkeeping entries' : 'From journal entries'}
                    </p>
                  </div>
                  <div className="p-6 border border-border rounded-lg bg-card">
                    <p className="text-sm text-muted-foreground font-medium">Tax Liability</p>
                    <p className="text-3xl font-light mt-2 text-red-600">
                      {formatCurrency(metrics.taxLiability)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {metrics.taxLiability === 0 ? 'Calculate in Tax module' : 'Current liability'}
                    </p>
                  </div>
                  <div className="p-6 border border-border rounded-lg bg-card">
                    <p className="text-sm text-muted-foreground font-medium">Audit Score</p>
                    <p className="text-3xl font-light mt-2 text-green-600">
                      {metrics.auditScore}/100
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      {metrics.auditScore === 0 ? 'No entries yet' : 'Based on data'}
                    </p>
                  </div>
                  <div className="p-6 border border-border rounded-lg bg-card">
                    <p className="text-sm text-muted-foreground font-medium">Risk Level</p>
                    <p className={`text-3xl font-light mt-2 ${getRiskColor(metrics.riskLevel)}`}>
                      {metrics.riskLevel}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Real-time assessment</p>
                  </div>
                </div>

                {/* Department grid + status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 p-6 border border-border rounded-lg bg-card">
                    <h3 className="font-semibold mb-4">All Departments</h3>
                    <div className="space-y-2">
                      {DEPARTMENTS.map((dept) => (
                        <button
                          key={dept.id}
                          onClick={() => setCurrentPage(dept.id)}
                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted transition-colors flex items-center justify-between text-sm group"
                        >
                          <div>
                            <span className="font-medium">{dept.label}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {dept.description}
                            </p>
                          </div>
                          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                            →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 border border-border rounded-lg bg-card">
                    <h3 className="font-semibold mb-4">System Status</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Journal Entries</span>
                        <span className="font-medium text-xs">{entryCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">AI Engine</span>
                        <span className="text-green-600 text-xs font-medium">Active</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Data Store</span>
                        <span className="text-green-600 text-xs font-medium">Real-time</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Modules</span>
                        <span className="text-xs font-medium">{DEPARTMENTS.length} Active</span>
                      </div>
                      <div className="pt-3 border-t border-border">
                        <button
                          onClick={refreshMetrics}
                          className="w-full text-center py-2 text-xs hover:bg-muted rounded-lg transition-colors font-medium"
                        >
                          Refresh Metrics
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
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

      <footer className="border-t border-border bg-card/50 px-6 py-4 text-center text-xs text-muted-foreground">
        Virtual CA Mind OS &copy; 2026 &mdash; Real-time Data Processing &mdash; No Dummy Values
      </footer>
    </div>
  );
}
