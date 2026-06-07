'use client';

import React, { useState } from 'react';
import {
  Plus,
  TrendingUp,
  Scale,
  Zap,
  Calendar,
  Download,
  Filter,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AccountingManagerPageProps {
  onBack: () => void;
}

interface FinancialData {
  period: string;
  revenue: number;
  expenses: number;
  netIncome: number;
}

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  account: string;
  debit: number;
  credit: number;
}

export default function AccountingManagerPage({ onBack }: AccountingManagerPageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [dateRange, setDateRange] = useState('6m');
  const [entries, setEntries] = useState<JournalEntry[]>([
    { id: '1', date: '2024-06-01', description: 'Invoice #001 from Client', account: 'Accounts Receivable', debit: 50000, credit: 0 },
    { id: '2', date: '2024-06-01', description: 'Service Revenue', account: 'Revenue', debit: 0, credit: 50000 },
    { id: '3', date: '2024-06-05', description: 'Office Rent', account: 'Rent Expense', debit: 15000, credit: 0 },
    { id: '4', date: '2024-06-05', description: 'Payment Made', account: 'Bank', debit: 0, credit: 15000 },
  ]);

  // Mock data for charts
  const monthlyData: FinancialData[] = [
    { period: 'Jan', revenue: 150000, expenses: 75000, netIncome: 75000 },
    { period: 'Feb', revenue: 175000, expenses: 85000, netIncome: 90000 },
    { period: 'Mar', revenue: 200000, expenses: 95000, netIncome: 105000 },
    { period: 'Apr', revenue: 195000, expenses: 98000, netIncome: 97000 },
    { period: 'May', revenue: 220000, expenses: 105000, netIncome: 115000 },
    { period: 'Jun', revenue: 250000, expenses: 115000, netIncome: 135000 },
  ];

  const expenseBreakdown = [
    { name: 'Salaries', value: 45, color: '#ef4444' },
    { name: 'Rent', value: 25, color: '#f97316' },
    { name: 'Utilities', value: 15, color: '#eab308' },
    { name: 'Marketing', value: 10, color: '#84cc16' },
    { name: 'Other', value: 5, color: '#22c55e' },
  ];

  // Financial Statements Data
  const profitLoss = {
    revenue: 250000,
    salariesExpense: 52000,
    rentExpense: 28000,
    utilitiesExpense: 17000,
    marketingExpense: 11000,
    otherExpense: 5000,
    totalExpenses: 113000,
    operatingIncome: 137000,
    interestExpense: 2000,
    taxExpense: 27000,
    netIncome: 108000,
  };

  const balanceSheet = {
    assets: {
      current: {
        cash: 250000,
        accountsReceivable: 75000,
        inventory: 100000,
        totalCurrent: 425000,
      },
      fixed: {
        propertyPlantEquipment: 200000,
        accumulatedDepreciation: -40000,
        netFixed: 160000,
      },
      totalAssets: 585000,
    },
    liabilities: {
      current: {
        accountsPayable: 50000,
        shortTermLoans: 30000,
        totalCurrent: 80000,
      },
      longTerm: {
        longTermDebt: 150000,
        totalLongTerm: 150000,
      },
      totalLiabilities: 230000,
    },
    equity: {
      capitalStock: 200000,
      retainedEarnings: 155000,
      totalEquity: 355000,
    },
  };

  const cashFlow = {
    operating: {
      netIncome: 108000,
      depreciation: 5000,
      decreaseInReceivables: 10000,
      increaseInPayables: 5000,
      totalOperating: 128000,
    },
    investing: {
      capitalExpenditures: -20000,
      totalInvesting: -20000,
    },
    financing: {
      debtRepayment: -15000,
      dividends: -20000,
      totalFinancing: -35000,
    },
    netCashFlow: 73000,
    beginningCash: 177000,
    endingCash: 250000,
  };

  const ratios = {
    currentRatio: (425000 / 80000).toFixed(2),
    debtToEquity: (230000 / 355000).toFixed(2),
    profitMargin: ((108000 / 250000) * 100).toFixed(1),
    roe: ((108000 / 355000) * 100).toFixed(1),
    roa: ((108000 / 585000) * 100).toFixed(1),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight">Accounting Manager</h2>
          <p className="text-muted-foreground mt-1.5 text-sm">Financial statements, journal entries, and accounting analysis</p>
        </div>
        <Button onClick={() => setShowEntryDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Entry
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Revenue</p>
            <p className="text-2xl font-light mt-2">₹{(profitLoss.revenue / 100000).toFixed(1)}L</p>
            <p className="text-xs text-green-600 mt-1.5">↑ 13.6% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Expenses</p>
            <p className="text-2xl font-light mt-2">₹{(profitLoss.totalExpenses / 100000).toFixed(1)}L</p>
            <p className="text-xs text-red-600 mt-1.5">↑ 7.6% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Net Income</p>
            <p className="text-2xl font-light mt-2">₹{(profitLoss.netIncome / 100000).toFixed(1)}L</p>
            <p className="text-xs text-green-600 mt-1.5">↑ 18.7% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Profit Margin</p>
            <p className="text-2xl font-light mt-2">{ratios.profitMargin}%</p>
            <p className="text-xs text-muted-foreground mt-1.5">43.2% target</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="w-4 h-4 hidden sm:block" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="statements" className="gap-2">
            <Scale className="w-4 h-4 hidden sm:block" />
            <span>Statements</span>
          </TabsTrigger>
          <TabsTrigger value="entries" className="gap-2">
            <Zap className="w-4 h-4 hidden sm:block" />
            <span>Journal</span>
          </TabsTrigger>
          <TabsTrigger value="ratios" className="gap-2">
            <Filter className="w-4 h-4 hidden sm:block" />
            <span>Ratios</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses Trend</CardTitle>
              <CardDescription>Last 6 months comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `₹${(value / 1000).toFixed(0)}K`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Profit Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `₹${(value / 1000).toFixed(0)}K`}
                    />
                    <Bar
                      dataKey="netIncome"
                      fill="#22c55e"
                      name="Net Income"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Statements Tab */}
        <TabsContent value="statements" className="space-y-6 mt-6">
          {/* Profit & Loss */}
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>For the period ending 30-Jun-2024</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="font-medium">Revenue</span>
                  <span className="font-medium">₹{(profitLoss.revenue / 100000).toFixed(1)}L</span>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-sm font-medium mb-2">Operating Expenses:</p>
                  <div className="pl-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Salaries & Wages</span>
                      <span>₹{(profitLoss.salariesExpense / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rent</span>
                      <span>₹{(profitLoss.rentExpense / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilities</span>
                      <span>₹{(profitLoss.utilitiesExpense / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Marketing</span>
                      <span>₹{(profitLoss.marketingExpense / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other Expenses</span>
                      <span>₹{(profitLoss.otherExpense / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 mt-2 border-t border-dashed border-border">
                    <span className="font-medium">Total Expenses</span>
                    <span className="font-medium">₹{(profitLoss.totalExpenses / 100000).toFixed(1)}L</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Net Income</span>
                    <span className="text-green-600">₹{(profitLoss.netIncome / 100000).toFixed(1)}L</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Sheet */}
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>As of 30-Jun-2024</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Assets */}
                <div className="space-y-3">
                  <h4 className="font-semibold">ASSETS</h4>
                  <div className="pl-4 space-y-2 text-sm">
                    <p className="font-medium">Current Assets:</p>
                    <div className="pl-4 space-y-1">
                      <div className="flex justify-between">
                        <span>Cash & Bank</span>
                        <span>₹{(balanceSheet.assets.current.cash / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accounts Receivable</span>
                        <span>₹{(balanceSheet.assets.current.accountsReceivable / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Inventory</span>
                        <span>₹{(balanceSheet.assets.current.inventory / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-dashed pt-1">
                        <span>Total Current</span>
                        <span>₹{(balanceSheet.assets.current.totalCurrent / 100000).toFixed(1)}L</span>
                      </div>
                    </div>

                    <p className="font-medium mt-3">Fixed Assets:</p>
                    <div className="pl-4 space-y-1">
                      <div className="flex justify-between">
                        <span>Property, Plant & Equipment</span>
                        <span>₹{(balanceSheet.assets.fixed.propertyPlantEquipment / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Less: Accumulated Depreciation</span>
                        <span>-₹{(Math.abs(balanceSheet.assets.fixed.accumulatedDepreciation) / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-dashed pt-1">
                        <span>Total Fixed</span>
                        <span>₹{(balanceSheet.assets.fixed.netFixed / 100000).toFixed(1)}L</span>
                      </div>
                    </div>

                    <div className="flex justify-between font-semibold border-t border-border pt-2 mt-2">
                      <span>TOTAL ASSETS</span>
                      <span>₹{(balanceSheet.assets.totalAssets / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div className="space-y-3">
                  <h4 className="font-semibold">LIABILITIES & EQUITY</h4>
                  <div className="pl-4 space-y-2 text-sm">
                    <p className="font-medium">Current Liabilities:</p>
                    <div className="pl-4 space-y-1">
                      <div className="flex justify-between">
                        <span>Accounts Payable</span>
                        <span>₹{(balanceSheet.liabilities.current.accountsPayable / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Short-term Loans</span>
                        <span>₹{(balanceSheet.liabilities.current.shortTermLoans / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-dashed pt-1">
                        <span>Total Current</span>
                        <span>₹{(balanceSheet.liabilities.current.totalCurrent / 100000).toFixed(1)}L</span>
                      </div>
                    </div>

                    <p className="font-medium mt-3">Long-term Liabilities:</p>
                    <div className="pl-4 space-y-1">
                      <div className="flex justify-between">
                        <span>Long-term Debt</span>
                        <span>₹{(balanceSheet.liabilities.longTerm.longTermDebt / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-dashed pt-1">
                        <span>Total Long-term</span>
                        <span>₹{(balanceSheet.liabilities.longTerm.totalLongTerm / 100000).toFixed(1)}L</span>
                      </div>
                    </div>

                    <div className="flex justify-between font-medium border-t border-border pt-2 mt-2">
                      <span>TOTAL LIABILITIES</span>
                      <span>₹{(balanceSheet.liabilities.totalLiabilities / 100000).toFixed(1)}L</span>
                    </div>

                    <p className="font-medium mt-3">Equity:</p>
                    <div className="pl-4 space-y-1">
                      <div className="flex justify-between">
                        <span>Capital Stock</span>
                        <span>₹{(balanceSheet.equity.capitalStock / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Retained Earnings</span>
                        <span>₹{(balanceSheet.equity.retainedEarnings / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-dashed pt-1">
                        <span>Total Equity</span>
                        <span>₹{(balanceSheet.equity.totalEquity / 100000).toFixed(1)}L</span>
                      </div>
                    </div>

                    <div className="flex justify-between font-semibold border-t border-border pt-2 mt-2">
                      <span>TOTAL LIAB. & EQUITY</span>
                      <span>₹{((balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.totalEquity) / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow Statement */}
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>For the period ending 30-Jun-2024</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium mb-2">Operating Activities:</p>
                  <div className="pl-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Net Income</span>
                      <span>₹{(cashFlow.operating.netIncome / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Add: Depreciation</span>
                      <span>₹{(cashFlow.operating.depreciation / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Decrease in Receivables</span>
                      <span>₹{(cashFlow.operating.decreaseInReceivables / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Increase in Payables</span>
                      <span>₹{(cashFlow.operating.increaseInPayables / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between font-medium border-t border-dashed pt-1">
                      <span>Cash from Operations</span>
                      <span className="text-green-600">₹{(cashFlow.operating.totalOperating / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="font-medium mb-2">Investing Activities:</p>
                  <div className="pl-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Capital Expenditures</span>
                      <span className="text-red-600">₹{(cashFlow.investing.capitalExpenditures / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between font-medium border-t border-dashed pt-1">
                      <span>Cash from Investing</span>
                      <span className="text-red-600">₹{(cashFlow.investing.totalInvesting / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="font-medium mb-2">Financing Activities:</p>
                  <div className="pl-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Debt Repayment</span>
                      <span className="text-red-600">₹{(cashFlow.financing.debtRepayment / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dividends Paid</span>
                      <span className="text-red-600">₹{(cashFlow.financing.dividends / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between font-medium border-t border-dashed pt-1">
                      <span>Cash from Financing</span>
                      <span className="text-red-600">₹{(cashFlow.financing.totalFinancing / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Net Change in Cash</span>
                    <span className="font-medium text-green-600">₹{(cashFlow.netCashFlow / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Beginning Cash Balance</span>
                    <span>₹{(cashFlow.beginningCash / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-border pt-1 text-base">
                    <span>Ending Cash Balance</span>
                    <span className="text-green-600">₹{(cashFlow.endingCash / 100000).toFixed(1)}L</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal Entries Tab */}
        <TabsContent value="entries" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Journal Entries</CardTitle>
              <CardDescription>All recorded transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="font-medium">{entry.account}</TableCell>
                        <TableCell className="text-right">
                          {entry.debit > 0 ? `₹${(entry.debit / 1000).toFixed(0)}K` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.credit > 0 ? `₹${(entry.credit / 1000).toFixed(0)}K` : '-'}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex justify-between font-medium">
                  <span>Total Debits:</span>
                  <span>₹{(entries.reduce((sum, e) => sum + e.debit, 0) / 100000).toFixed(1)}L</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total Credits:</span>
                  <span>₹{(entries.reduce((sum, e) => sum + e.credit, 0) / 100000).toFixed(1)}L</span>
                </div>
                <div className="text-xs text-muted-foreground pt-2">
                  Trial Balance: {entries.reduce((sum, e) => sum + e.debit, 0) === entries.reduce((sum, e) => sum + e.credit, 0) ? '✓ Balanced' : '✗ Not Balanced'}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ratios Tab */}
        <TabsContent value="ratios" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Ratios & Analysis</CardTitle>
              <CardDescription>Key performance indicators for your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-4">Liquidity Ratios</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Current Ratio</span>
                        <Badge variant="outline">{ratios.currentRatio}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Measures ability to pay short-term obligations. Healthy range: 1.5 - 2.0</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Solvency Ratios</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Debt-to-Equity Ratio</span>
                        <Badge variant="outline">{ratios.debtToEquity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Measures financial leverage. Lower is generally better.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Profitability Ratios</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Profit Margin</span>
                        <Badge variant="outline">{ratios.profitMargin}%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Percentage of revenue remaining as profit after expenses.</p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Return on Equity (ROE)</span>
                        <Badge variant="outline">{ratios.roe}%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Return generated on shareholder investment.</p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Return on Assets (ROA)</span>
                        <Badge variant="outline">{ratios.roa}%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Efficiency in using assets to generate profit.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Entry Dialog */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Journal Entry</DialogTitle>
            <DialogDescription>Add a new transaction to your books</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input type="date" id="date" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="Enter transaction description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account">Account</Label>
                <Input id="account" placeholder="e.g., Bank, Revenue" />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => setShowEntryDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowEntryDialog(false)}>Save Entry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
