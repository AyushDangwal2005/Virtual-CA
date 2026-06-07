import { NextRequest, NextResponse } from 'next/server';
import { insightsService } from '@/lib/services/insights-service';
import { logger } from '@/lib/utils/logger';
import { handleError, ValidationError } from '@/lib/utils/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { insightType, data } = body;

    if (!insightType || !data) {
      throw new ValidationError('insightType and data are required');
    }

    logger.info('INSIGHTS_API', 'Generating insights', { insightType });

    let insights;

    switch (insightType) {
      case 'expense-anomalies':
        insights = insightsService.detectExpenseAnomalies(data);
        break;

      case 'duplicate-invoices':
        insights = insightsService.detectDuplicateInvoices(data);
        break;

      case 'payment-risks':
        insights = insightsService.detectPaymentRisks(data);
        break;

      case 'vendor-risks':
        insights = insightsService.detectVendorRisks(data);
        break;

      case 'tax-optimization':
        insights = insightsService.identifyTaxOptimizations(data);
        break;

      case 'cash-flow-warnings':
        insights = insightsService.detectCashFlowWarnings(data);
        break;

      case 'comprehensive-report':
        insights = insightsService.generateInsightsReport(
          data.expenses || [],
          data.invoices || [],
          data.vendors || [],
          data.financialData || {}
        );
        break;

      default:
        throw new ValidationError(`Unknown insightType: ${insightType}`);
    }

    logger.info('INSIGHTS_API', 'Insights generated successfully', { alertCount: insights.length });

    return NextResponse.json(
      {
        success: true,
        insightType,
        alerts: insights,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorResponse = handleError(error);
    logger.error('INSIGHTS_API', 'Insights generation failed', error);

    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
