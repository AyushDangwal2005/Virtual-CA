# Virtual CA Platform - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended)
- Supabase account
- Environment variables configured

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Start development server
pnpm dev

# Visit http://localhost:3000
```

---

## 📋 Module Walkthrough

### 1. Invoice Manager
**Location**: `components/pages/invoice-manager-page.tsx`  
**Accessible via**: Dashboard > Core Modules > Invoice Manager

**Key Features**:
- Upload invoices (PDF, JPG, PNG, Excel, CSV)
- OCR-based data extraction
- Track payment status
- View analytics (Total, Paid, Pending, GST)
- Search and filter invoices
- View invoice details in modal

**Test It**:
1. Click "Upload Invoice" button
2. Drag and drop a file
3. View extracted data
4. Check invoice list with filters

---

### 2. Accounting Manager
**Location**: `components/pages/accounting-manager-page.tsx`  
**Accessible via**: Dashboard > Core Modules > Accounting Manager

**Key Features**:
- **Overview Tab**: Financial trends and expense breakdown
- **Statements Tab**: P&L, Balance Sheet, Cash Flow
- **Journal Tab**: Add and view journal entries
- **Ratios Tab**: Financial metrics and analysis

**Financial Statements**:
```
Profit & Loss Statement
├── Revenue: ₹2.50L
├── Expenses: ₹1.13L
└── Net Income: ₹1.08L (43.2% margin)

Balance Sheet
├── Assets: ₹5.85L
├── Liabilities: ₹2.30L
└── Equity: ₹3.55L

Cash Flow
├── Operating: ₹1.28L
├── Investing: -₹0.20L
└── Financing: -₹0.35L
```

**Financial Ratios**:
- Current Ratio: 5.31 (Liquidity)
- Debt-to-Equity: 0.65 (Solvency)
- Profit Margin: 43.2% (Profitability)
- ROE: 30.4% | ROA: 18.5%

**Test It**:
1. View Overview tab - See charts
2. Switch to Statements tab
3. Check P&L Statement
4. View Balance Sheet
5. Analyze ratios

---

### 3. AI Finance Assistant
**Location**: `components/pages/ai-assistant-page.tsx`  
**Accessible via**: Dashboard > Core Modules > AI Finance Assistant

**Key Features**:
- Chat interface with message history
- Suggested questions sidebar
- Topic filtering
- Source attribution
- Knowledge base coverage

**Ask These Questions**:
- "What are the GST compliance requirements?"
- "How can I optimize my tax planning?"
- "Explain my cash flow position"
- "What are the best practices for invoice management?"
- "How do I reduce business expenses?"

**Sample Responses Include**:
- GST rules and rates
- Tax deduction strategies
- Cash flow analysis
- Accounting guidance
- Compliance requirements

**Test It**:
1. Click on a suggested question
2. Or type your own question
3. View AI response with sources
4. Click source links for references

---

### 4. Financial Intelligence
**Location**: `components/pages/financial-intelligence-page.tsx`  
**Accessible via**: Dashboard > Advanced > Financial Intelligence

**Key Features**:

**Market Data Tab**:
- Stock indices (Nifty, Sensex, Bank Nifty)
- Individual stocks (INFY, TCS, RELIANCE, HDFC)
- Price movements and percentages
- 6-day trend chart
- Market sentiment gauge

**News Tab**:
- GST Updates
- Tax News
- Business News
- Compliance Announcements
- Filter by category
- Source attribution
- Publication dates

**Analysis Tab**:
- Market insights
- Economic indicators
- RBI policy updates
- Government initiatives
- Key metrics to monitor

**Test It**:
1. Review current market indices
2. Check stock prices
3. View market trend chart
4. Filter news by category
5. Read market analysis

---

## 📊 Dashboard Overview

### Main Dashboard (`app/page.tsx`)
- Executive metrics at the top
- Department grid
- System status panel
- Quick navigation

### Key Metrics Displayed
- Total Revenue
- Total Expenses
- Tax Liability
- Audit Score
- Risk Level
- Compliance Rate

### Department Organization
**Core Modules** (5):
- Bookkeeping
- Invoice Manager ✨ NEW
- Accounting Manager ✨ NEW
- Tax Planning
- Compliance
- AI Finance Assistant ✨ NEW

**Advanced Modules** (6):
- Financial Intelligence ✨ NEW
- Audit
- Risk Analytics
- Forecasting
- CFO Decisions
- Customers & Vendors

---

## 🔧 Service Layer

### Available Services

#### 1. Invoice Service
```typescript
// lib/services/invoice-service.ts
- uploadInvoiceDocument(file, type, userId)
- processDocumentOCR(documentId)
- extractInvoiceData(documentId)
- createInvoiceFromData(userId, docId, data)
- searchInvoices(userId, filters)
- getInvoiceAnalytics(userId)
- updateInvoiceStatus(userId, invId, status)
```

#### 2. Accounting Service
```typescript
// lib/services/accounting-service.ts
- createJournalEntry(userId, entry)
- getJournalEntries(userId)
- calculateTrialBalance(userId)
- calculateProfitLoss(userId, startDate, endDate)
- calculateBalanceSheet(userId)
- calculateCashFlow(userId, startDate, endDate)
- calculateFinancialRatios(userId)
```

#### 3. AI Finance Service
```typescript
// lib/services/ai-finance-service.ts
- askFinanceAssistant(query)
- getChatHistory(userId, limit)
- initializeKnowledgeBase()
```

#### 4. CFO Service
```typescript
// lib/services/cfo-service.ts
- calculateHealthScore(userId)
- generateRecommendations(userId)
- generateForecasts(userId, months)
- getCFODashboardSummary(userId)
```

#### 5. Financial Intelligence Service
```typescript
// lib/services/financial-intelligence-service.ts
- getStockPrice(symbol)
- getIndexData(indexSymbol)
- getFinancialNews(category, limit)
- getForexRate(baseCurrency, quoteCurrency)
- getGSTUpdates(limit)
- getTaxUpdates(limit)
```

---

## 🗄️ Database Tables

### User Data Tables
```
users
├── id (UUID)
├── email
├── full_name
├── company_name
└── RLS: User can only see their own data

documents
├── id, user_id
├── file_name, file_path
├── document_type (invoice, bill, receipt, etc)
├── ocr_data, extracted_data
├── processing_status (pending, processing, completed, failed)
└── RLS: User can only see their own documents

invoices
├── id, user_id, document_id
├── invoice_number, invoice_date, due_date
├── vendor_name, customer_name
├── amount, gst_amount, total_amount
├── payment_status (pending, partial, paid)
└── RLS: User can only see their own invoices

[Plus 9 other tables for accounting, customers, vendors, etc]
```

### Knowledge Base Table
```
knowledge_base
├── id, title, content
├── category (gst_rules, tax_laws, accounting_standards, etc)
├── source, reference_url
├── embedding (vector for RAG)
└── No RLS (shared public knowledge)
```

---

## 🎨 UI Components Used

### From Shadcn/ui
- Card, Button, Input, Dialog
- Tabs, Badge, Table
- Label, Checkbox, Radio
- Separator, ScrollArea
- Toast, Dropdown

### From Recharts
- LineChart
- BarChart
- PieChart
- AreaChart

### Icons from Lucide
- FileUp, Search, Filter, Download
- Clock, CheckCircle, AlertCircle
- TrendingUp, TrendingDown
- MessageSquare, Plus, Eye
- And 20+ more

---

## 📡 API Endpoints

### Custom Routes
```
POST /api/documents/process-ocr
├── Handles OCR processing
├── Accepts: file, documentId, userId
└── Returns: OCR data, extracted data

POST /api/analyze
├── Financial analysis (existing)
└── Custom analysis requests
```

### Database Operations
All CRUD operations available through service layer:
```typescript
// Database access
import * as db from '@/lib/supabase/db';

await db.getInvoices(userId);
await db.createInvoice(userId, invoiceData);
await db.getJournalEntries(userId);
await db.searchKnowledgeBase(query);
```

---

## 🔐 Security

### Row Level Security (RLS)
- Users can only access their own data
- Policies enforced at database level
- Knowledge base is publicly readable

### Authentication
- Supabase Auth (JWT)
- Session management
- User isolation

### Input Validation
- Type-safe with TypeScript
- Form validation ready
- SQL injection prevention

---

## 📈 Sample Data

### Mock Invoice
```json
{
  "invoiceNumber": "INV-2024-001",
  "vendorName": "Tech Supplies Ltd",
  "invoiceDate": "2024-06-01",
  "dueDate": "2024-06-30",
  "amount": 50000,
  "gstAmount": 9000,
  "totalAmount": 59000,
  "paymentStatus": "pending"
}
```

### Mock Financial Data
```json
{
  "totalRevenue": 250000,
  "totalExpenses": 113000,
  "netIncome": 137000,
  "taxLiability": 27000,
  "profitMargin": 43.2
}
```

### Mock Stock Data
```json
{
  "symbol": "NIFTY",
  "name": "Nifty 50",
  "price": 19250,
  "change": 125,
  "changePercent": 0.65
}
```

---

## 🎯 Next Steps

### To Integrate Real APIs
1. **OCR**: Replace mock with PaddleOCR
   - File: `lib/services/invoice-service.ts`
   - Function: `processDocumentOCR()`

2. **LLM**: Connect Qwen/Llama
   - File: `lib/services/ai-finance-service.ts`
   - Function: `callAIEngine()`

3. **Stock Data**: Enable Alpha Vantage
   - File: `lib/services/financial-intelligence-service.ts`
   - Add API key to env

4. **Knowledge Base**: Add BGE embeddings
   - File: `lib/services/ai-finance-service.ts`
   - Implement vector search

---

## 📚 Additional Resources

- **Platform Guide**: See `PLATFORM_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Database Schema**: See `migrations/001_init_schema.sql`

---

## 🐛 Troubleshooting

### Build Issues
```bash
# Clear cache and rebuild
rm -rf .next
pnpm build
```

### Database Connection
- Check Supabase URL in `.env.local`
- Verify API keys are set
- Ensure RLS policies are enabled

### Missing Data
- Run migration: `migrations/001_init_schema.sql`
- Initialize knowledge base in AI service
- Check RLS policies for user isolation

---

## 📞 Support

For issues or questions:
1. Check PLATFORM_GUIDE.md
2. Review service implementations
3. Check database schema
4. Verify environment variables

---

**Happy Building!** 🎉

Version: 1.0.0  
Last Updated: June 7, 2024
