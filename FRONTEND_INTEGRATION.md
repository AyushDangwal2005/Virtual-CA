# Frontend Integration Guide - Virtual CA Platform

## Quick Start

The backend is ready! Here's how to integrate it with your frontend components.

## 1. Using the Backend Hooks

All API communication is handled through custom React hooks in `lib/hooks/useBackend.ts`.

### Basic Usage

```tsx
import { useInvoices, useAIChat, useDashboard } from '@/lib/hooks/useBackend';

export function InvoiceList() {
  const { fetchInvoices, uploadInvoice, loading, error } = useInvoices();
  
  useEffect(() => {
    fetchInvoices(50, 0).then(data => {
      console.log('Invoices:', data);
    });
  }, []);

  const handleFileUpload = async (file: File) => {
    const result = await uploadInvoice(file);
    console.log('Upload result:', result);
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {/* Display invoices */}
    </div>
  );
}
```

## 2. Dashboard Integration

```tsx
import { useDashboard } from '@/lib/hooks/useBackend';

export function Dashboard() {
  const { fetchDashboard, loading } = useDashboard();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboard().then(setData);
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  
  return (
    <div>
      <h2>Financial Health: {data?.metrics.healthScore}/100</h2>
      <p>Revenue: ₹{data?.metrics.statements.profitAndLoss.revenue}</p>
      <p>Expenses: ₹{data?.metrics.statements.profitAndLoss.expenses}</p>
      
      <h3>Recent Invoices</h3>
      {data?.recentInvoices.map(inv => (
        <div key={inv.id}>
          <p>{inv.invoice_number} - ₹{inv.total_amount}</p>
          <p>Status: {inv.payment_status}</p>
        </div>
      ))}
    </div>
  );
}
```

## 3. Invoice Management

```tsx
import { useInvoices } from '@/lib/hooks/useBackend';

export function InvoiceManager() {
  const { fetchInvoices, uploadInvoice, loading } = useInvoices();
  
  const handleUpload = async (file: File) => {
    const result = await uploadInvoice(file);
    if (result?.success) {
      alert('Invoice processing started: ' + result.data.documentId);
      // Poll to check processing status
      setTimeout(() => {
        fetchInvoices().then(data => {
          // Check if document was processed
        });
      }, 3000);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept=".pdf,.jpg,.png,.xlsx,.csv"
        onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
      />
    </div>
  );
}
```

## 4. AI Chat Integration

```tsx
import { useAIChat } from '@/lib/hooks/useBackend';

export function AIAssistant() {
  const { sendMessage, fetchHistory, loading } = useAIChat();
  const [messages, setMessages] = useState([]);

  const handleSendMessage = async (text: string) => {
    const response = await sendMessage(text, 'general');
    if (response) {
      setMessages([...messages, {
        role: 'user',
        content: text
      }, {
        role: 'assistant',
        content: response.answer,
        sources: response.sources
      }]);
    }
  };

  return (
    <div className="chat-container">
      {messages.map((msg, i) => (
        <div key={i} className={`message ${msg.role}`}>
          <p>{msg.content}</p>
          {msg.sources && (
            <div className="sources">
              {msg.sources.map((src, j) => (
                <a key={j} href={src.referenceUrl || '#'}>
                  {src.title}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
      <input 
        type="text" 
        placeholder="Ask a question..."
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSendMessage(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
}
```

## 5. Analytics Dashboard

```tsx
import { useAnalytics } from '@/lib/hooks/useBackend';

export function AnalyticsDashboard() {
  const { fetchAll, loading } = useAnalytics();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAll().then(setAnalytics);
  }, []);

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div>
      <div className="card">
        <h3>Invoices</h3>
        <p>Total: ₹{analytics?.invoices.totalAmount}</p>
        <p>Paid: ₹{analytics?.invoices.paidAmount}</p>
        <p>Pending: ₹{analytics?.invoices.pendingAmount}</p>
        <p>Payment Rate: {analytics?.invoices.paymentRate.toFixed(1)}%</p>
      </div>

      <div className="card">
        <h3>Expenses</h3>
        <p>Total: ₹{analytics?.expenses.totalExpenses}</p>
        <p>By Category:</p>
        {Object.entries(analytics?.expenses.byCategory || {}).map(([cat, amount]) => (
          <p key={cat}>{cat}: ₹{amount}</p>
        ))}
      </div>

      <div className="card">
        <h3>GST Analysis</h3>
        <p>Collected: ₹{analytics?.gst.gstCollected}</p>
        <p>Paid: ₹{analytics?.gst.gstPaid}</p>
        <p>Liability: ₹{analytics?.gst.gstLiability}</p>
      </div>
    </div>
  );
}
```

## 6. Accounting Module

```tsx
import { useAccounting } from '@/lib/hooks/useBackend';

export function FinancialStatements() {
  const { fetchStatements, fetchMetrics, loading } = useAccounting();
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchStatements(),
      fetchMetrics()
    ]).then(([statements, metrics]) => {
      setData({ statements, metrics });
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  const { statements, metrics } = data || {};

  return (
    <div>
      <section className="profit-loss">
        <h3>Profit & Loss</h3>
        <p>Revenue: ₹{statements?.profitAndLoss.revenue}</p>
        <p>Expenses: ₹{statements?.profitAndLoss.expenses}</p>
        <p className="highlight">Net Income: ₹{statements?.profitAndLoss.netIncome}</p>
        <p>Net Margin: {(statements?.profitAndLoss.netMargin * 100).toFixed(2)}%</p>
      </section>

      <section className="balance-sheet">
        <h3>Balance Sheet</h3>
        <p>Total Assets: ₹{statements?.balanceSheet.totalAssets}</p>
        <p>Total Liabilities: ₹{statements?.balanceSheet.totalLiabilities}</p>
        <p className="highlight">Equity: ₹{statements?.balanceSheet.totalEquity}</p>
      </section>

      <section className="financial-health">
        <h3>Financial Health</h3>
        <div className="health-score">
          <div className="score">{metrics?.healthScore}/100</div>
          <div className="risk-level">{metrics?.riskLevel}</div>
        </div>
      </section>
    </div>
  );
}
```

## 7. Market Intelligence

```tsx
import { useMarketData } from '@/lib/hooks/useBackend';

export function MarketIntelligence() {
  const { fetchAll, loading } = useMarketData();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAll().then(setData);
  }, []);

  return (
    <div>
      <section className="indices">
        <h3>Market Indices</h3>
        <div className="index">
          <span>Nifty 50</span>
          <span className={data?.nifty?.changePercent > 0 ? 'positive' : 'negative'}>
            {data?.nifty?.price?.toFixed(2)}
            ({data?.nifty?.changePercent?.toFixed(2)}%)
          </span>
        </div>
        <div className="index">
          <span>Sensex</span>
          <span className={data?.sensex?.changePercent > 0 ? 'positive' : 'negative'}>
            {data?.sensex?.price?.toFixed(2)}
            ({data?.sensex?.changePercent?.toFixed(2)}%)
          </span>
        </div>
      </section>

      <section className="news">
        <h3>Financial News</h3>
        {data?.news?.map((article) => (
          <article key={article.url}>
            <a href={article.url} target="_blank">
              <h4>{article.title}</h4>
            </a>
            <p>{article.description}</p>
            <small>{article.source} - {new Date(article.publishedAt).toLocaleDateString()}</small>
          </article>
        ))}
      </section>
    </div>
  );
}
```

## 8. Customer & Vendor Management

```tsx
import { useCustomers, useVendors } from '@/lib/hooks/useBackend';

export function CustomersList() {
  const { fetchCustomers, addCustomer, loading } = useCustomers();
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchCustomers().then(data => setCustomers(data?.customers || []));
  }, []);

  const handleAddCustomer = async (formData) => {
    const result = await addCustomer(formData);
    if (result) {
      // Refresh list
      fetchCustomers().then(data => setCustomers(data?.customers || []));
    }
  };

  return (
    <div>
      <button onClick={() => showCustomerForm(handleAddCustomer)}>
        Add Customer
      </button>
      
      {customers.map(customer => (
        <div key={customer.id} className="customer-card">
          <h4>{customer.name}</h4>
          <p>{customer.email}</p>
          <p>Invoiced: ₹{customer.total_invoiced}</p>
          <p>Outstanding: ₹{customer.outstanding_amount}</p>
        </div>
      ))}
    </div>
  );
}
```

## 9. Expense Tracking

```tsx
import { useExpenses } from '@/lib/hooks/useBackend';

export function ExpenseTracker() {
  const { fetchExpenses, addExpense } = useExpenses();
  const [expenses, setExpenses] = useState([]);

  const handleAddExpense = async (expenseData) => {
    const result = await addExpense(expenseData);
    if (result) {
      // Refresh
      fetchExpenses().then(data => setExpenses(data?.expenses || []));
    }
  };

  return (
    <div>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        handleAddExpense(Object.fromEntries(formData));
      }}>
        <input name="date" type="date" required />
        <input name="category" type="text" placeholder="Category" required />
        <input name="description" type="text" placeholder="Description" />
        <input name="amount" type="number" step="0.01" required />
        <input name="gstAmount" type="number" step="0.01" />
        <select name="paymentStatus">
          <option>pending</option>
          <option>paid</option>
        </select>
        <button type="submit">Add Expense</button>
      </form>

      <div className="expense-list">
        {expenses.map(exp => (
          <div key={exp.id} className="expense-item">
            <p>{exp.category} - ₹{exp.amount}</p>
            <p>{exp.description}</p>
            <p className="status">{exp.payment_status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 10. User Context Setup

Make sure to set the user ID when the user logs in:

```tsx
import { useAuth } from '@/lib/hooks/useAuth'; // Your auth hook

export function App() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      // Store user ID for API calls
      localStorage.setItem('user_id', user.id);
    }
  }, [user]);

  return <YourApp />;
}
```

## Error Handling

All hooks return `error` and `loading` states:

```tsx
const { fetchData, loading, error } = useInvoices();

useEffect(() => {
  fetchData().then(data => {
    if (error) {
      showErrorNotification(error);
    } else {
      setData(data);
    }
  });
}, []);
```

## Polling for Status

For long-running operations like OCR, poll the API:

```tsx
const pollDocumentStatus = async (documentId) => {
  const maxAttempts = 30; // 30 * 2 = 60 seconds
  let attempts = 0;

  while (attempts < maxAttempts) {
    const doc = await fetch(`/api/invoices?id=${documentId}`);
    const result = await doc.json();
    
    if (result.data.processing_status === 'completed') {
      return result.data;
    }
    
    if (result.data.processing_status === 'failed') {
      throw new Error(result.data.error_message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }
  
  throw new Error('Processing timeout');
};
```

## Common Patterns

### Display Financial Metrics
```tsx
const { healthScore, riskLevel, statements } = metrics;

return (
  <div className="metrics-grid">
    <MetricCard title="Financial Health" value={`${healthScore}/100`} />
    <MetricCard title="Risk Level" value={riskLevel} />
    <MetricCard title="Revenue" value={`₹${statements.profitAndLoss.revenue}`} />
    <MetricCard title="Profit Margin" value={`${(statements.profitAndLoss.netMargin * 100).toFixed(1)}%`} />
  </div>
);
```

### Show Loading States
```tsx
import { Loader } from '@/components/ui/loader';

function MyComponent() {
  const { fetchData, loading } = useMyHook();

  return (
    <>
      {loading && <Loader />}
      {!loading && <Content />}
    </>
  );
}
```

### Handle Errors Gracefully
```tsx
function MyComponent() {
  const { fetchData, error } = useMyHook();

  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
```

---

## Testing Endpoints

You can test endpoints directly with curl:

```bash
# Get dashboard
curl http://localhost:3000/api/dashboard \
  -H "x-user-id: test-user-123"

# Upload invoice (simulate file upload)
curl -X POST http://localhost:3000/api/invoices \
  -H "x-user-id: test-user-123" \
  -F "file=@test.pdf"

# Get analytics
curl http://localhost:3000/api/analytics?type=all \
  -H "x-user-id: test-user-123"

# Ask AI a question
curl -X POST http://localhost:3000/api/ai/chat \
  -H "x-user-id: test-user-123" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is GST?", "category": "gst"}'
```

---

## Performance Tips

1. **Cache dashboard data** - It doesn't change every second
2. **Paginate lists** - Use limit/offset for large datasets
3. **Lazy load images** - Use next/image
4. **Debounce search** - Wait for user to finish typing
5. **Use SWR** - For automatic revalidation

```tsx
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(r => r.json());

export function Dashboard() {
  const { data, error, isLoading } = useSWR(
    '/api/dashboard?uid=123',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return <div>{/* content */}</div>;
}
```

---

## Troubleshooting

### "User ID required" error
Make sure to set the user ID in localStorage:
```tsx
localStorage.setItem('user_id', userId);
```

### API returns 500 error
Check the Vercel function logs:
1. Go to Vercel dashboard
2. Click on your project
3. Click "Functions"
4. Check the logs for the failing endpoint

### No data showing up
1. Check if data was uploaded to the database
2. Verify user ID matches
3. Check browser console for errors
4. Check Supabase dashboard for data

---

## Next Steps

1. Copy the hook files to your project
2. Install missing dependencies (if any)
3. Update component imports
4. Set user ID on login
5. Test each hook
6. Integrate into your UI
7. Deploy to production

---

**The backend is ready. Start integrating!** 🚀
