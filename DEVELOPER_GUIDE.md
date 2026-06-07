# Virtual CA Platform - Developer Quick Reference

Fast reference for implementing features using the integrated APIs and services.

## Quick API Reference

### Send Chat Message
```typescript
const response = await fetch('/api/v1/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What is GST?',
    category: 'gst', // or 'tax', 'accounting', 'general'
    includeRag: true
  })
});
const result = await response.json();
// result.data.answer, result.data.sources, result.data.citations
```

### Process Document
```typescript
const response = await fetch('/api/v1/documents/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageBase64: '...',
    documentType: 'invoice'
  })
});
const result = await response.json();
// result.data.structuredData { invoiceNumber, amount, gstNumber, ... }
```

### Get Market Data
```typescript
// Stock quote
const res1 = await fetch('/api/v1/market-data?type=stock&query=INFY');

// Market indices
const res2 = await fetch('/api/v1/market-data?type=indices');

// News
const res3 = await fetch('/api/v1/market-data?type=news&query=GST');

// Tax news
const res4 = await fetch('/api/v1/market-data?type=tax-news');
```

### Generate Insights
```typescript
const response = await fetch('/api/v1/insights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    insightType: 'expense-anomalies', // See list below
    data: expenseArray
  })
});
// Returns: { alerts: [...] }
```

**Insight Types**:
- `expense-anomalies` - Unusual expenses
- `duplicate-invoices` - Duplicate detection
- `payment-risks` - Overdue/at-risk payments
- `vendor-risks` - Vendor payment issues
- `tax-optimization` - Tax saving opportunities
- `cash-flow-warnings` - Liquidity warnings
- `comprehensive-report` - All insights combined

### Query Knowledge Base
```typescript
// Search
const res1 = await fetch('/api/v1/knowledge-base', {
  method: 'POST',
  body: JSON.stringify({ action: 'search', query: 'tax laws' })
});

// Query with RAG
const res2 = await fetch('/api/v1/knowledge-base', {
  method: 'POST',
  body: JSON.stringify({ action: 'query', query: 'GST rules' })
});

// Add document
const res3 = await fetch('/api/v1/knowledge-base', {
  method: 'POST',
  body: JSON.stringify({
    action: 'add',
    document: {
      title: 'Title',
      content: 'Content',
      category: 'gst', // gst, tax, accounting, compliance, case-study, financial
      source: 'Source Name'
    }
  })
});

// Initialize samples
const res4 = await fetch('/api/v1/knowledge-base', {
  method: 'POST',
  body: JSON.stringify({ action: 'initialize' })
});
```

---

## Direct Service Usage

### Use LLM Client
```typescript
import { llmClient } from '@/lib/api-clients/llm-client';

// Simple completion
const text = await llmClient.complete('Your prompt here');

// Chat with history
const response = await llmClient.chat([
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' },
  { role: 'user', content: 'How are you?' }
]);

// Specialized guidance
const gst = await llmClient.getGSTGuidance('GST question');
const accounting = await llmClient.getAccountingGuidance('Accounting question');
const analysis = await llmClient.analyzeFinancials(financialData);
```

### Use OCR Client
```typescript
import { ocrClient } from '@/lib/api-clients/ocr-client';

// Process image
const ocr = await ocrClient.processDocument(imageBase64);
console.log(ocr.text);
console.log(ocr.confidence); // 0-1

// Extract invoice data
const invoice = await ocrClient.extractInvoiceData(ocr.text);
console.log(invoice.invoiceNumber);
console.log(invoice.amount);
console.log(invoice.gstNumber);
console.log(invoice.dueDate);
```

### Use Embeddings
```typescript
import { embeddingsClient } from '@/lib/api-clients/embeddings-client';

// Single embedding
const emb = await embeddingsClient.embed('Your text');
console.log(emb.vector); // 384-dimensional array
console.log(emb.dimension); // 384

// Batch embeddings
const embs = await embeddingsClient.embedBatch(['text1', 'text2', 'text3']);

// Find similar
const similar = await embeddingsClient.findMostSimilar(
  'Query text',
  ['candidate1', 'candidate2', 'candidate3']
);
// Returns: [{ text, similarity }, ...]

// Similarity score
const score = embeddingsClient.cosineSimilarity(vec1, vec2);
```

### Use Market Data
```typescript
import {
  alphaVantageClient,
  finnhubClient,
  newsAPIClient
} from '@/lib/api-clients/market-data-client';

// Stock quote
const quote = await alphaVantageClient.getStockQuote('INFY');
// { symbol, price, change, changePercent, timestamp, currency }

// Forex
const rate = await alphaVantageClient.getForexRate('INR', 'USD');
// { rate, timestamp }

// News
const news1 = await finnhubClient.getNews('general', 10);
const news2 = await newsAPIClient.getBusinessNews('GST', 10);
const news3 = await newsAPIClient.getTaxNews(10);
// Returns: [{ title, description, url, source, publishedAt, imageUrl }, ...]
```

### Use RAG Service
```typescript
import { ragService } from '@/lib/services/rag-service';

// Query with sources
const response = await ragService.query('GST question');
// { answer, sources: [{ title, category, excerpt, similarity }], citations }

// Search knowledge base
const docs = await ragService.search('tax laws');
// Returns: KnowledgeDocument[]

// Add document
await ragService.addDocument({
  title: 'GST Rules',
  content: 'Complete GST rules...',
  category: 'gst',
  source: 'GST Council'
});

// Initialize samples
await ragService.initializeSampleDocuments();
```

### Use Insights Service
```typescript
import { insightsService } from '@/lib/services/insights-service';

// Detect anomalies
const anomalies = insightsService.detectExpenseAnomalies(expenses);
// Returns: InsightAlert[]

// Find duplicates
const duplicates = insightsService.detectDuplicateInvoices(invoices);
// Returns: DuplicateInvoice[]

// Payment risks
const risks = insightsService.detectPaymentRisks(invoices);
// Returns: InsightAlert[]

// Vendor risks
const vendorRisks = insightsService.detectVendorRisks(vendors);
// Returns: InsightAlert[]

// Tax optimization
const taxOpts = insightsService.identifyTaxOptimizations(financialData);
// Returns: InsightAlert[]

// Cash flow warnings
const warnings = insightsService.detectCashFlowWarnings(cashData);
// Returns: InsightAlert[]

// Complete report
const all = insightsService.generateInsightsReport(
  expenses, invoices, vendors, financialData
);
// Returns: InsightAlert[] (all types, sorted by severity)
```

### Use CFO Service
```typescript
import { cfService } from '@/lib/services/cfo-service';

// Health score
const health = cfService.calculateFinancialHealth(financialData);
// { score: 0-100, rating: 'Excellent'|'Good'|'Fair'|'Poor', breakdown: {...} }

// Recommendations
const recs = cfService.generateRecommendations(data);
// Returns: string[]

// Revenue forecast
const revForecast = cfService.forecastRevenue(historicalData);
// Returns: { periods: [...] }

// Expense forecast
const expForecast = cfService.forecastExpenses(historicalData);
// Returns: { periods: [...] }

// Cash flow forecast
const cfForecast = cfService.forecastCashFlow(data);
// Returns: { periods: [...] }
```

---

## Utilities

### Caching
```typescript
import { getOrSetCache, setInCache, createCacheKey, CACHE_DURATIONS } from '@/lib/utils/cache';

// Auto cache with fallback
const data = await getOrSetCache(
  'my_key',
  async () => await expensiveCall(),
  CACHE_DURATIONS.LONG // 30 minutes
);

// Manual set
setInCache('key', value, CACHE_DURATIONS.MEDIUM);

// Create cache key
const key = createCacheKey('user', userId, 'invoices');
```

### Retry
```typescript
import { retryWithBackoff } from '@/lib/utils/retry';

const result = await retryWithBackoff(
  async () => await apiCall(),
  { maxAttempts: 3, delay: 1000, backoff: true }
);
```

### Errors
```typescript
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ExternalServiceError,
  TimeoutError,
  handleError
} from '@/lib/utils/errors';

// Throw specific error
throw new ValidationError('Missing field');

// Handle any error
const errorResponse = handleError(error);
// { code, statusCode, message, details }
```

### Logging
```typescript
import { logger } from '@/lib/utils/logger';

logger.debug('SERVICE_NAME', 'Debug message', { data });
logger.info('SERVICE_NAME', 'Info message', { data });
logger.warn('SERVICE_NAME', 'Warning message', { data });
logger.error('SERVICE_NAME', 'Error message', error, { data });
```

---

## Common Patterns

### Process Invoice File
```typescript
async function processInvoice(file: File) {
  // 1. Read file as base64
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target?.result;

    // 2. Call API
    const res = await fetch('/api/v1/documents/process', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: base64, documentType: 'invoice' })
    });
    const result = await res.json();

    // 3. Use structured data
    const { invoiceNumber, amount, gstNumber, dueDate } = result.data.structuredData;
    console.log('Invoice:', invoiceNumber, 'Amount:', amount);

    // 4. Store or display
    return result.data;
  };
  reader.readAsDataURL(file);
}
```

### Generate Insights Report
```typescript
async function generateReport(expenses, invoices, vendors, financialData) {
  const res = await fetch('/api/v1/insights', {
    method: 'POST',
    body: JSON.stringify({
      insightType: 'comprehensive-report',
      data: { expenses, invoices, vendors, financialData }
    })
  });
  const result = await res.json();

  // Sort by severity
  const critical = result.alerts.filter(a => a.severity === 'critical');
  const high = result.alerts.filter(a => a.severity === 'high');

  console.log('Critical Alerts:', critical);
  console.log('High Priority:', high);

  return result.alerts;
}
```

### AI Q&A System
```typescript
async function askQuestion(question: string) {
  // Auto-detect category
  let category = 'general';
  if (question.toLowerCase().includes('gst')) category = 'gst';
  else if (question.toLowerCase().includes('tax')) category = 'tax';
  else if (question.toLowerCase().includes('invoice')) category = 'accounting';

  // Send to API
  const res = await fetch('/api/v1/chat', {
    method: 'POST',
    body: JSON.stringify({ message: question, category, includeRag: true })
  });
  const result = await res.json();

  // Display answer with sources
  console.log('Answer:', result.data.answer);
  console.log('Sources:');
  result.data.sources.forEach(source => {
    console.log(`  - ${source.title} (${source.category})`);
  });

  return result.data;
}
```

---

## Environment Setup

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional (graceful fallback if not set)
HF_TOKEN=hf_xxxx
ALPHA_VANTAGE_API_KEY=xxxx
FINNHUB_API_KEY=xxxx
NEWS_API_KEY=xxxx
```

---

## Testing Services

### Health Check
```typescript
async function checkHealth() {
  const res = await fetch('/api/v1/health');
  const health = await res.json();

  console.log('Supabase:', health.services.supabase);
  console.log('OCR:', health.services.ocr);
  console.log('LLM:', health.services.llm);
  console.log('Market Data:', health.services.alphaVantage);
  console.log('News:', health.services.newsAPI);
}
```

### Test LLM
```typescript
import { llmClient } from '@/lib/api-clients/llm-client';

async function testLLM() {
  try {
    const response = await llmClient.complete('Hello, how are you?');
    console.log('LLM Response:', response);
  } catch (error) {
    console.error('LLM Error:', error);
  }
}
```

### Test OCR
```typescript
import { ocrClient } from '@/lib/api-clients/ocr-client';

async function testOCR(imageBase64: string) {
  try {
    const result = await ocrClient.processDocument(imageBase64);
    console.log('OCR Text:', result.text);
    console.log('Confidence:', result.confidence);
  } catch (error) {
    console.error('OCR Error:', error);
  }
}
```

---

## File Organization

```
/vercel/share/v0-project/
├── lib/
│   ├── api-clients/
│   │   ├── ocr-client.ts
│   │   ├── llm-client.ts
│   │   ├── embeddings-client.ts
│   │   └── market-data-client.ts
│   ├── services/
│   │   ├── rag-service.ts
│   │   ├── insights-service.ts
│   │   ├── cfo-service.ts
│   │   ├── accounting-service.ts
│   │   ├── ai-finance-service.ts
│   │   └── financial-intelligence-service.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── db.ts
│   ├── utils/
│   │   ├── cache.ts
│   │   ├── retry.ts
│   │   ├── errors.ts
│   │   └── logger.ts
│   └── hooks/
│       └── useAPI.ts
├── app/
│   └── api/
│       └── v1/
│           ├── documents/
│           │   └── process/
│           │       └── route.ts
│           ├── chat/
│           │   └── route.ts
│           ├── market-data/
│           │   └── route.ts
│           ├── insights/
│           │   └── route.ts
│           ├── knowledge-base/
│           │   └── route.ts
│           └── health/
│               └── route.ts
├── components/
│   ├── pages/
│   │   ├── ai-assistant-page.tsx ✨ Updated
│   │   └── financial-intelligence-page.tsx ✨ Updated
│   └── ui/
│       └── ...
├── migrations/
│   └── 001_init_schema.sql
└── docs/
    ├── API_INTEGRATIONS.md
    ├── INTEGRATION_COMPLETION.md
    ├── DEVELOPER_GUIDE.md
    └── QUICK_START.md
```

---

## Key Features Summary

✅ Document OCR with invoice extraction  
✅ AI Finance Assistant with RAG  
✅ Real-time market data  
✅ News aggregation  
✅ Expense anomaly detection  
✅ Duplicate invoice detection  
✅ Payment risk management  
✅ Vendor risk monitoring  
✅ Tax optimization suggestions  
✅ Cash flow forecasting  
✅ Financial health scoring  
✅ Comprehensive error handling  
✅ Intelligent caching  
✅ Automatic retry logic  
✅ Structured logging  

---

**Version**: 1.0.0  
**Last Updated**: 2024-06-07  
**Status**: Production Ready
