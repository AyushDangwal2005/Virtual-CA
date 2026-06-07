# API Integrations & AI Services Documentation

Complete guide to all integrated APIs, AI models, and external services in the Virtual CA platform.

## Table of Contents

1. [Supabase](#supabase)
2. [PaddleOCR](#paddleocr)
3. [Qwen LLM](#qwen-llm)
4. [BGE Embeddings](#bge-embeddings)
5. [RAG Knowledge Base](#rag-knowledge-base)
6. [Financial Data APIs](#financial-data-apis)
7. [News APIs](#news-apis)
8. [Insights Engine](#insights-engine)
9. [API Routes](#api-routes)
10. [Error Handling & Caching](#error-handling--caching)

---

## Supabase

**Status**: ✅ Configured

Supabase provides all backend infrastructure: database, authentication, storage, real-time updates, and vector search.

### Configuration

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Features

- **Authentication**: User sign-up, login, session management
- **PostgreSQL Database**: 13 tables for invoices, accounting, chat history, etc.
- **File Storage**: Document uploads (invoices, receipts, PDFs)
- **pgvector**: Vector search for RAG knowledge base
- **Real-time**: Live updates for collaborative features

### Key Tables

- `users` - User accounts and profiles
- `companies` - Company/organization data
- `invoices` - Invoice records with OCR data
- `accounting_entries` - Journal entries
- `chat_history` - AI assistant conversations
- `knowledge_base` - RAG documents with embeddings
- `ocr_results` - Extracted document data

---

## PaddleOCR

**Status**: ✅ Integrated via HuggingFace

OCR client for document processing and invoice data extraction.

### File

`lib/api-clients/ocr-client.ts`

### Usage

```typescript
import { ocrClient } from '@/lib/api-clients/ocr-client';

// Process document
const result = await ocrClient.processDocument(imageBase64);
// Returns: { text, confidence, boundingBoxes }

// Extract invoice data
const invoiceData = await ocrClient.extractInvoiceData(ocrResult.text);
// Returns: { invoiceNumber, gstNumber, vendorName, amount, date, etc. }
```

### Extracted Fields

- Invoice Number
- GST Number
- Vendor Name
- Customer Name
- Tax Amount
- Invoice Date
- Due Date
- Total Amount
- Payment Method

### Confidence Score

Returns 0-1 confidence score for extraction accuracy.

---

## Qwen LLM

**Status**: ✅ Integrated via HuggingFace

Qwen 2.5 7B Instruct model for financial AI assistance.

### File

`lib/api-clients/llm-client.ts`

### Configuration

```env
HF_TOKEN=hf_xxxxxxxxxxxx
```

### Usage

```typescript
import { llmClient } from '@/lib/api-clients/llm-client';

// Chat with history
const response = await llmClient.chat([
  { role: 'user', content: 'What is GST?' }
]);

// Financial analysis
const analysis = await llmClient.analyzeFinancials(financialData);

// GST guidance
const guidance = await llmClient.getGSTGuidance('Question about GST');

// Accounting guidance
const accounting = await llmClient.getAccountingGuidance('Accounting question');
```

### Features

- Multi-turn conversations
- Financial analysis
- GST guidance
- Accounting expertise
- Tax planning advice
- Caching for common questions

### Response Format

```typescript
{
  content: string;
  model: 'Qwen/Qwen2.5-7B-Instruct';
  tokens: { prompt, completion, total };
}
```

---

## BGE Embeddings

**Status**: ✅ Integrated via HuggingFace

BAAI/bge-small-en-v1.5 for semantic search and RAG.

### File

`lib/api-clients/embeddings-client.ts`

### Usage

```typescript
import { embeddingsClient } from '@/lib/api-clients/embeddings-client';

// Generate embedding
const embedding = await embeddingsClient.embed('Your text here');

// Batch embeddings
const embeddings = await embeddingsClient.embedBatch([
  'Text 1',
  'Text 2'
]);

// Find similar documents
const similar = await embeddingsClient.findMostSimilar(
  'Query text',
  ['candidate1', 'candidate2']
);

// Calculate similarity
const score = embeddingsClient.cosineSimilarity(vec1, vec2);
```

### Features

- Semantic search
- Similarity calculation (cosine)
- Batch processing
- Local caching
- 384-dimensional vectors

---

## RAG Knowledge Base

**Status**: ✅ Implemented

Retrieval Augmented Generation for cited, source-backed responses.

### File

`lib/services/rag-service.ts`

### Usage

```typescript
import { ragService } from '@/lib/services/rag-service';

// Query with RAG
const response = await ragService.query('GST question');
// Returns: { answer, sources, citations }

// Search knowledge base
const docs = await ragService.search('tax laws');

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

### Knowledge Base Categories

- `gst` - GST rules and regulations
- `tax` - Tax laws and guidelines
- `accounting` - Accounting standards
- `compliance` - Compliance guides
- `case-study` - Real-world cases
- `financial` - Financial reporting

### Response Format

```typescript
{
  answer: string;
  sources: [{
    title: string;
    category: string;
    excerpt: string;
    similarity: number;
  }];
  citations: string[];
}
```

---

## Financial Data APIs

### Alpha Vantage

**Status**: ✅ Integrated

Real-time stock, forex, and commodity data.

```env
ALPHA_VANTAGE_API_KEY=xxxxx
```

**File**: `lib/api-clients/market-data-client.ts`

**Usage**:

```typescript
import { alphaVantageClient } from '@/lib/api-clients/market-data-client';

// Stock quote
const quote = await alphaVantageClient.getStockQuote('INFY');

// Forex rate
const rate = await alphaVantageClient.getForexRate('INR', 'USD');
```

### Finnhub

**Status**: ✅ Integrated

Financial news and company data.

```env
FINNHUB_API_KEY=xxxxx
```

**Usage**:

```typescript
import { finnhubClient } from '@/lib/api-clients/market-data-client';

// Company news
const news = await finnhubClient.getNews('general', 10);
```

### NewsAPI

**Status**: ✅ Integrated

Business and financial news aggregation.

```env
NEWS_API_KEY=xxxxx
```

**Usage**:

```typescript
import { newsAPIClient } from '@/lib/api-clients/market-data-client';

// Business news
const news = await newsAPIClient.getBusinessNews('GST', 10);

// Tax news
const taxNews = await newsAPIClient.getTaxNews(10);
```

---

## Insights Engine

**Status**: ✅ Implemented

Automatic detection of financial anomalies and opportunities.

### File

`lib/services/insights-service.ts`

### Features

1. **Expense Anomalies**: Detect unusual expenses using statistical analysis
2. **Duplicate Invoices**: Find exact and near-duplicate invoices
3. **Payment Risks**: Identify overdue and at-risk payments
4. **Vendor Risks**: Monitor vendor payment history and outstanding amounts
5. **Tax Optimization**: Identify tax saving opportunities
6. **Cash Flow Warnings**: Alert on low cash runway and liquidity issues

### Usage

```typescript
import { insightsService } from '@/lib/services/insights-service';

// Individual insights
insightsService.detectExpenseAnomalies(expenses);
insightsService.detectDuplicateInvoices(invoices);
insightsService.detectPaymentRisks(invoices);
insightsService.detectVendorRisks(vendors);
insightsService.identifyTaxOptimizations(financialData);
insightsService.detectCashFlowWarnings(cashData);

// Comprehensive report
const allInsights = insightsService.generateInsightsReport(
  expenses,
  invoices,
  vendors,
  financialData
);
```

### Alert Severity Levels

- `critical` - Immediate action required
- `high` - Action needed soon
- `medium` - Review recommended
- `low` - FYI/monitoring

---

## API Routes

All API routes follow REST conventions with error handling and caching.

### 1. Document Processing

**Endpoint**: `POST /api/v1/documents/process`

Process invoices and documents with OCR.

```bash
curl -X POST http://localhost:3000/api/v1/documents/process \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "...",
    "documentType": "invoice"
  }'
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "doc_123",
    "rawText": "...",
    "confidence": 0.95,
    "structuredData": {
      "invoiceNumber": "INV-001",
      "amount": 10000
    }
  }
}
```

### 2. Chat / AI Assistant

**Endpoint**: `POST /api/v1/chat`

Send questions to the AI Finance Assistant.

```bash
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is GST?",
    "category": "gst",
    "includeRag": true
  }'
```

**Response**:

```json
{
  "success": true,
  "data": {
    "answer": "GST is...",
    "sources": [{
      "title": "GST Rules",
      "category": "gst",
      "similarity": 0.95
    }],
    "citations": ["GST Council"]
  }
}
```

### 3. Market Data

**Endpoint**: `GET /api/v1/market-data`

Fetch real-time market data, news, and financial information.

```bash
# Get stock quote
curl http://localhost:3000/api/v1/market-data?type=stock&query=INFY

# Get indices
curl http://localhost:3000/api/v1/market-data?type=indices

# Get news
curl http://localhost:3000/api/v1/market-data?type=news&query=GST

# Get tax news
curl http://localhost:3000/api/v1/market-data?type=tax-news
```

### 4. Insights

**Endpoint**: `POST /api/v1/insights`

Generate intelligence and anomaly detection.

```bash
curl -X POST http://localhost:3000/api/v1/insights \
  -H "Content-Type: application/json" \
  -d '{
    "insightType": "expense-anomalies",
    "data": [
      { "amount": 5000, "date": "2024-06-01", "category": "travel" }
    ]
  }'
```

### 5. Knowledge Base

**Endpoint**: `POST /api/v1/knowledge-base`

Manage and query the knowledge base.

```bash
# Query
curl -X POST http://localhost:3000/api/v1/knowledge-base \
  -d '{"action": "query", "query": "GST rules"}'

# Search
curl -X POST http://localhost:3000/api/v1/knowledge-base \
  -d '{"action": "search", "query": "tax laws"}'

# Add document
curl -X POST http://localhost:3000/api/v1/knowledge-base \
  -d '{
    "action": "add",
    "document": {
      "title": "New Guide",
      "content": "...",
      "category": "gst"
    }
  }'

# Initialize samples
curl -X POST http://localhost:3000/api/v1/knowledge-base \
  -d '{"action": "initialize"}'
```

### 6. Health Check

**Endpoint**: `GET /api/v1/health`

Check service status and configuration.

```bash
curl http://localhost:3000/api/v1/health
```

---

## Error Handling & Caching

### Error Classes

All errors follow a standardized format with proper HTTP status codes.

```typescript
// Validation errors (400)
throw new ValidationError('Missing required field');

// Authentication errors (401)
throw new AuthenticationError('Invalid credentials');

// Not found errors (404)
throw new NotFoundError('Resource not found');

// Rate limit errors (429)
throw new RateLimitError('Too many requests', 60);

// External service errors (502)
throw new ExternalServiceError('API Name', 'Error details');

// Timeout errors (504)
throw new TimeoutError('Request took too long');
```

### Caching Strategy

| Service | TTL | Strategy |
|---------|-----|----------|
| Stock quotes | 5 min | Expiring cache |
| Embeddings | 30 min | In-memory cache |
| LLM responses | 5 min | Query-based cache |
| News | 30 min | Expiring cache |
| Knowledge search | 10 min | Expiring cache |

### Retry Logic

- **Max Attempts**: 3
- **Initial Delay**: 1000ms
- **Backoff**: Exponential (2x)
- **Max Timeout**: 30 seconds

---

## Utilities

### Cache Utility

```typescript
import { getOrSetCache, setInCache, createCacheKey } from '@/lib/utils/cache';

// Automatic cache with fallback
const data = await getOrSetCache(
  'my_key',
  async () => {
    return await expensiveOperation();
  },
  300 // TTL in seconds
);
```

### Retry Utility

```typescript
import { retryWithBackoff } from '@/lib/utils/retry';

const result = await retryWithBackoff(
  async () => await apiCall(),
  { maxAttempts: 3, delay: 1000, backoff: true }
);
```

### Logger

```typescript
import { logger } from '@/lib/utils/logger';

logger.info('SERVICE_NAME', 'Message', { data: 'value' });
logger.error('SERVICE_NAME', 'Error occurred', error);
```

---

## Frontend Integration

### useAPI Hook

```typescript
import { useAPI, apiService } from '@/lib/hooks/useAPI';

function MyComponent() {
  const { request, loading, error } = useAPI();

  const handleChat = async () => {
    const result = await apiService.sendChatMessage('Question');
  };
}
```

---

## Environment Variables Checklist

```bash
✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ HF_TOKEN
✅ ALPHA_VANTAGE_API_KEY
✅ FINNHUB_API_KEY
✅ NEWS_API_KEY
```

---

## Performance Metrics

| Operation | Latency | Cache | Retry |
|-----------|---------|-------|-------|
| OCR Processing | 2-5s | None | 3x |
| LLM Response | 1-3s | 5 min | 3x |
| Embeddings | 1-2s | 30 min | 3x |
| Stock Quote | 1s | 5 min | 3x |
| News Fetch | 1-2s | 30 min | 3x |
| Knowledge Search | <1s | 10 min | 2x |

---

## Troubleshooting

### Services Unavailable

Check `/api/v1/health` endpoint for service status.

```typescript
const health = await apiService.checkHealth();
// Shows which services are configured/available
```

### Rate Limiting

APIs implement intelligent retry with exponential backoff. If rate limited:

- Stock API: Wait before next request
- LLM: Use cached responses when available
- News: Check cache first (30 min TTL)

### OCR Confidence

If OCR confidence is low (<0.8):
- Check image quality
- Ensure proper document positioning
- Try alternative image format

### LLM Timeout

If LLM responses timeout:
- Check network connectivity
- Reduce max_tokens parameter
- Retry with shorter prompt

---

## Future Enhancements

- [ ] OpenAI API fallback
- [ ] Custom model fine-tuning
- [ ] Realtime market data subscriptions
- [ ] Advanced RAG with semantic chunking
- [ ] Multi-language support
- [ ] Custom knowledge base uploads
