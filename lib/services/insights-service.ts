import { logger } from '@/lib/utils/logger';

export interface InsightAlert {
  id: string;
  type: 'expense-anomaly' | 'duplicate-invoice' | 'payment-risk' | 'vendor-risk' | 'tax-optimization' | 'cash-flow-warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation?: string;
  data?: Record<string, any>;
  createdAt: Date;
}

export interface DuplicateInvoice {
  invoiceId1: string;
  invoiceId2: string;
  similarity: number;
  reason: string;
}

/**
 * Insights Service - Detect anomalies and generate intelligence
 */
export class InsightsService {
  private readonly SERVICE_NAME = 'INSIGHTS_SERVICE';

  /**
   * Detect expense anomalies
   */
  detectExpenseAnomalies(expenses: Array<{ amount: number; date: string; category: string }>): InsightAlert[] {
    logger.info(this.SERVICE_NAME, 'Detecting expense anomalies', { count: expenses.length });

    const alerts: InsightAlert[] = [];

    // Group expenses by category
    const categoryExpenses = new Map<string, number[]>();
    for (const expense of expenses) {
      if (!categoryExpenses.has(expense.category)) {
        categoryExpenses.set(expense.category, []);
      }
      categoryExpenses.get(expense.category)!.push(expense.amount);
    }

    // Detect anomalies in each category
    for (const [category, amounts] of categoryExpenses) {
      if (amounts.length < 3) continue;

      const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const stdDev = Math.sqrt(amounts.reduce((sq, n) => sq + Math.pow(n - average, 2), 0) / amounts.length);

      for (const amount of amounts) {
        if (Math.abs(amount - average) > 2 * stdDev) {
          alerts.push({
            id: `anomaly-${Date.now()}-${Math.random()}`,
            type: 'expense-anomaly',
            severity: amount > average * 2 ? 'high' : 'medium',
            title: `Unusual expense in ${category}`,
            description: `Expense of ${amount} is significantly higher than average of ${average.toFixed(2)}`,
            recommendation: `Review this transaction for legitimacy. Consider if this is a one-time expense or indicates a trend.`,
            data: { category, amount, average, deviation: stdDev },
            createdAt: new Date(),
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Detect duplicate invoices
   */
  detectDuplicateInvoices(invoices: Array<{ id: string; number: string; amount: number; date: string; vendor: string }>): DuplicateInvoice[] {
    logger.info(this.SERVICE_NAME, 'Detecting duplicate invoices', { count: invoices.length });

    const duplicates: DuplicateInvoice[] = [];

    for (let i = 0; i < invoices.length; i++) {
      for (let j = i + 1; j < invoices.length; j++) {
        const inv1 = invoices[i];
        const inv2 = invoices[j];

        // Check for exact duplicates
        if (inv1.number === inv2.number && inv1.vendor === inv2.vendor) {
          duplicates.push({
            invoiceId1: inv1.id,
            invoiceId2: inv2.id,
            similarity: 1.0,
            reason: 'Identical invoice number and vendor',
          });
          continue;
        }

        // Check for near-duplicates (same amount and date)
        if (inv1.amount === inv2.amount && inv1.date === inv2.date && inv1.vendor === inv2.vendor) {
          duplicates.push({
            invoiceId1: inv1.id,
            invoiceId2: inv2.id,
            similarity: 0.95,
            reason: 'Same amount, date, and vendor',
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * Detect payment risks
   */
  detectPaymentRisks(
    invoices: Array<{ id: string; dueDate: string; amount: number; status: string; daysOverdue?: number }>
  ): InsightAlert[] {
    logger.info(this.SERVICE_NAME, 'Detecting payment risks', { count: invoices.length });

    const alerts: InsightAlert[] = [];
    const today = new Date();

    for (const invoice of invoices) {
      const dueDate = new Date(invoice.dueDate);
      const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Overdue
      if (daysUntilDue < 0) {
        alerts.push({
          id: `payment-risk-${invoice.id}`,
          type: 'payment-risk',
          severity: Math.abs(daysUntilDue) > 30 ? 'critical' : 'high',
          title: 'Overdue Payment',
          description: `Invoice ${invoice.id} is ${Math.abs(daysUntilDue)} days overdue. Amount: ${invoice.amount}`,
          recommendation: 'Follow up with customer immediately to collect payment.',
          data: { invoiceId: invoice.id, daysOverdue: Math.abs(daysUntilDue), amount: invoice.amount },
          createdAt: new Date(),
        });
      }

      // Due soon
      if (daysUntilDue > 0 && daysUntilDue < 7) {
        alerts.push({
          id: `payment-upcoming-${invoice.id}`,
          type: 'payment-risk',
          severity: 'medium',
          title: 'Payment Due Soon',
          description: `Invoice ${invoice.id} is due in ${daysUntilDue} days. Amount: ${invoice.amount}`,
          recommendation: 'Prepare for outgoing payment.',
          createdAt: new Date(),
        });
      }
    }

    return alerts;
  }

  /**
   * Detect vendor risks
   */
  detectVendorRisks(vendors: Array<{ id: string; name: string; invoiceCount: number; outstandingAmount: number; paymentHistory: 'good' | 'average' | 'poor' }>): InsightAlert[] {
    logger.info(this.SERVICE_NAME, 'Detecting vendor risks', { count: vendors.length });

    const alerts: InsightAlert[] = [];

    for (const vendor of vendors) {
      // High outstanding amount
      if (vendor.outstandingAmount > 500000) {
        // More than 5 lakh
        alerts.push({
          id: `vendor-risk-${vendor.id}`,
          type: 'vendor-risk',
          severity: 'high',
          title: `High outstanding amount with ${vendor.name}`,
          description: `Outstanding amount: ${vendor.outstandingAmount}`,
          recommendation: 'Schedule payment or negotiate terms.',
          createdAt: new Date(),
        });
      }

      // Poor payment history
      if (vendor.paymentHistory === 'poor') {
        alerts.push({
          id: `vendor-payment-${vendor.id}`,
          type: 'vendor-risk',
          severity: 'high',
          title: `Payment history concern with ${vendor.name}`,
          description: 'This vendor has a history of payment delays or issues.',
          recommendation: 'Review contract terms and consider alternative vendors.',
          createdAt: new Date(),
        });
      }
    }

    return alerts;
  }

  /**
   * Identify tax optimization opportunities
   */
  identifyTaxOptimizations(data: { gstCollected: number; gstPaid: number; profits: number; expenses: number }): InsightAlert[] {
    logger.info(this.SERVICE_NAME, 'Identifying tax optimization opportunities');

    const alerts: InsightAlert[] = [];

    // GST optimization
    const gstLiability = data.gstCollected - data.gstPaid;
    if (gstLiability > 100000) {
      // More than 1 lakh
      alerts.push({
        id: `tax-gst-${Date.now()}`,
        type: 'tax-optimization',
        severity: 'medium',
        title: 'GST Liability Optimization',
        description: `Current GST liability: ${gstLiability}. Consider timing of purchases for Input Tax Credits.`,
        recommendation: 'Review GST compliance and input credit utilization.',
        createdAt: new Date(),
      });
    }

    // Profit-based recommendations
    if (data.profits > 1000000 && data.expenses < data.profits * 0.3) {
      alerts.push({
        id: `tax-profit-${Date.now()}`,
        type: 'tax-optimization',
        severity: 'low',
        title: 'Tax Planning Opportunity',
        description: 'High profits with low expense ratio indicates potential tax saving opportunities.',
        recommendation: 'Explore Section 80C deductions and business expense optimization.',
        createdAt: new Date(),
      });
    }

    return alerts;
  }

  /**
   * Detect cash flow warnings
   */
  detectCashFlowWarnings(data: { balance: number; monthlyBurn: number; receivables: number; payables: number }): InsightAlert[] {
    logger.info(this.SERVICE_NAME, 'Detecting cash flow warnings');

    const alerts: InsightAlert[] = [];

    // Low cash runway
    const monthsOfCash = data.balance / data.monthlyBurn;
    if (monthsOfCash < 3) {
      alerts.push({
        id: `cashflow-runway-${Date.now()}`,
        type: 'cash-flow-warning',
        severity: monthsOfCash < 1 ? 'critical' : 'high',
        title: 'Low Cash Runway',
        description: `Current cash balance covers only ${monthsOfCash.toFixed(1)} months of burn rate.`,
        recommendation: 'Accelerate collections and reduce expenses. Consider financing options.',
        createdAt: new Date(),
      });
    }

    // High receivables
    if (data.receivables > data.balance) {
      alerts.push({
        id: `cashflow-receivables-${Date.now()}`,
        type: 'cash-flow-warning',
        severity: 'medium',
        title: 'High Outstanding Receivables',
        description: `Receivables (${data.receivables}) exceed current cash balance (${data.balance}).`,
        recommendation: 'Focus on collections to improve liquidity.',
        createdAt: new Date(),
      });
    }

    return alerts;
  }

  /**
   * Generate combined insights report
   */
  generateInsightsReport(
    expenses: Array<{ amount: number; date: string; category: string }>,
    invoices: Array<{ id: string; number: string; amount: number; date: string; vendor: string; dueDate: string; status: string }>,
    vendors: Array<{ id: string; name: string; invoiceCount: number; outstandingAmount: number; paymentHistory: 'good' | 'average' | 'poor' }>,
    financialData: { gstCollected: number; gstPaid: number; profits: number; expenses: number; balance: number; monthlyBurn: number; receivables: number; payables: number }
  ): InsightAlert[] {
    logger.info(this.SERVICE_NAME, 'Generating comprehensive insights report');

    const allAlerts: InsightAlert[] = [];

    // Collect all alerts
    allAlerts.push(...this.detectExpenseAnomalies(expenses));

    const invoiceArray = invoices.map((inv) => ({
      id: inv.id,
      dueDate: inv.dueDate,
      amount: inv.amount,
      status: inv.status,
    }));
    allAlerts.push(...this.detectPaymentRisks(invoiceArray));

    allAlerts.push(...this.detectVendorRisks(vendors));
    allAlerts.push(...this.identifyTaxOptimizations(financialData));
    allAlerts.push(...this.detectCashFlowWarnings(financialData));

    // Sort by severity
    const severityMap = { critical: 4, high: 3, medium: 2, low: 1 };
    allAlerts.sort((a, b) => severityMap[b.severity] - severityMap[a.severity]);

    logger.info(this.SERVICE_NAME, 'Insights report generated', { totalAlerts: allAlerts.length });

    return allAlerts;
  }
}

export const insightsService = new InsightsService();
