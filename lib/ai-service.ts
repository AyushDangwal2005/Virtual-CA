export interface FinancialAnalysisRequest {
  type: 'bookkeeping' | 'tax' | 'compliance' | 'audit' | 'risk' | 'forecast' | 'cfo';
  data: Record<string, any>;
  query: string;
}

export interface FinancialAnalysisResponse {
  analysis: string;
  recommendations: string[];
  confidence?: number;
}

export async function analyzeFinancialData(
  request: FinancialAnalysisRequest
): Promise<FinancialAnalysisResponse> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Analysis failed:', error);
    return {
      analysis: 'Analysis service temporarily unavailable. Displaying standard analysis.',
      recommendations: [
        'Review financial statements for accuracy',
        'Consult with financial advisor for complex scenarios',
        'Consider external audit for assurance',
      ],
      confidence: 0.6,
    };
  }
}
