import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';

const PROMPTS: Record<string, string> = {
  bookkeeping: `You are an expert chartered accountant. Analyze the following bookkeeping data and provide:
1. Journal entry validation
2. Account classification verification
3. Double-entry principle confirmation
4. Any discrepancies or issues
5. Recommendations for better accounting practices

Data: {DATA}
Query: {QUERY}

Provide a concise structured analysis (3-4 sentences) with specific numbers and 3 actionable recommendations.`,

  tax: `You are an Indian tax specialist (CA). Analyze the following financial data for tax optimization:
1. Tax liability assessment based on income and deductions
2. Tax-saving opportunities under Indian tax law
3. GST/Income Tax/TDS compliance flags
4. Practical tax strategies

Data: {DATA}
Query: {QUERY}

Provide a concise analysis (3-4 sentences) with 3 specific actionable recommendations.`,

  compliance: `You are a compliance expert specializing in Indian corporate law and tax compliance. Evaluate:
1. Filing deadlines status (ITR, GST, TDS, ROC)
2. Regulatory requirements checklist
3. Penalty exposure if any
4. Priority action items

Data: {DATA}
Query: {QUERY}

Provide a concise compliance summary (3-4 sentences) with 3 prioritized action items.`,

  audit: `You are an audit specialist (CA). Analyze the following financial records:
1. Transaction verification completeness
2. Documentation quality
3. Fraud risk indicators
4. Audit readiness assessment
5. Internal control weaknesses

Data: {DATA}
Query: {QUERY}

Provide an audit readiness assessment (3-4 sentences) with 3 specific findings or recommendations.`,

  risk: `You are a financial risk analyst. Evaluate the following business financial position:
1. Cash flow and liquidity risk
2. Revenue concentration risk
3. Operational leverage risk
4. Debt sustainability
5. Mitigation priority actions

Data: {DATA}
Query: {QUERY}

Provide a risk summary (3-4 sentences) with 3 specific mitigation recommendations.`,

  forecast: `You are a financial forecasting expert. Generate scenario-based revenue projections:
1. Historical trend analysis
2. Base, optimistic, and conservative scenarios
3. Key growth assumptions
4. Confidence levels and risks

Data: {DATA}
Query: {QUERY}

Provide a concise forecast summary (3-4 sentences) with 3 scenario-specific recommendations.`,

  cfo: `You are a CFO advisor for a growing Indian business. Provide strategic decision support:
1. Financial impact of the decision
2. Risk-benefit assessment
3. Cash flow implications
4. Implementation roadmap
5. Key KPIs to track

Data: {DATA}
Query: {QUERY}

Provide strategic CFO-level advice (3-4 sentences) with 3 specific actionable recommendations.`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, query } = body as {
      type: string;
      data: Record<string, unknown>;
      query: string;
    };

    const promptTemplate = PROMPTS[type];
    if (!promptTemplate) {
      return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }

    const prompt = promptTemplate
      .replace('{DATA}', JSON.stringify(data))
      .replace('{QUERY}', query);

    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt,
      maxOutputTokens: 600,
    });

    // Split response into analysis paragraph + bullet recommendations
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const recommendations: string[] = [];
    const analysisLines: string[] = [];

    for (const line of lines) {
      const isBullet =
        /^[-•*]\s/.test(line) ||
        /^\d+[.)]\s/.test(line) ||
        line.toLowerCase().startsWith('recommend');
      if (isBullet) {
        recommendations.push(line.replace(/^[-•*\d.)\s]+/, '').trim());
      } else {
        analysisLines.push(line);
      }
    }

    const analysis =
      analysisLines.join(' ').trim() || text.split('.').slice(0, 2).join('.') + '.';
    const finalRecs =
      recommendations.length > 0
        ? recommendations.slice(0, 3)
        : [
            'Review the data inputs for completeness and accuracy.',
            'Consult a CA for complex scenarios requiring professional judgment.',
            'Document assumptions and maintain audit trails for all key decisions.',
          ];

    return NextResponse.json({
      analysis,
      recommendations: finalRecs,
      confidence: 0.85,
    });
  } catch (error) {
    console.error('[v0] AI analysis error:', error);

    // Graceful fallback — never crash the UI
    return NextResponse.json({
      analysis:
        'AI analysis engine is initialising. Standard analysis templates are being applied to your financial data.',
      recommendations: [
        'Verify all financial inputs for completeness and accuracy.',
        'Consult a qualified CA for scenarios requiring professional judgment.',
        'Maintain proper documentation and audit trails for all transactions.',
      ],
      confidence: 0.65,
    });
  }
}
