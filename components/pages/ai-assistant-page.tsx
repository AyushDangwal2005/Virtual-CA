'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageCircle, ExternalLink, Filter, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    title: string;
    category: string;
    referenceUrl?: string;
  }>;
  timestamp: Date;
}

interface AssistantPageProps {
  onBack: () => void;
}

export default function AIAssistantPage({ onBack }: AssistantPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Mock initial messages for demonstration
  useEffect(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I&apos;m your Virtual CA Assistant. I can help you with accounting guidance, GST support, tax planning, and financial analysis. What can I help you with today?',
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Determine category from input
      const lowerInput = inputValue.toLowerCase();
      let category = 'general';
      if (lowerInput.includes('gst') || lowerInput.includes('tax')) category = 'gst';
      else if (lowerInput.includes('accounting') || lowerInput.includes('invoice')) category = 'accounting';

      // Call API
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          category,
          includeRag: true,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get response');
      }

      const mockResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.data.answer,
        sources: result.data.sources?.map((src: any) => ({
          title: src.title,
          category: src.category,
        })) || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, mockResponse]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);

      // Auto-scroll to bottom
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  const suggestedQuestions = [
    'What are the GST compliance requirements for my business?',
    'How can I optimize my tax planning?',
    'Explain my cash flow and liquidity position',
    'What are the best practices for invoice management?',
    'How do I reduce business expenses?',
  ];

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'gst', label: 'GST & Tax' },
    { id: 'accounting', label: 'Accounting' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'finance', label: 'Finance' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-light tracking-tight">AI Finance Assistant</h2>
        <p className="text-muted-foreground mt-1.5 text-sm">Ask questions about accounting, GST, taxes, and get AI-powered answers with cited sources</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chat Area */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="flex flex-col h-[600px]">
            <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
              <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted border border-border'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-current border-opacity-20 space-y-2">
                            <p className="text-xs font-semibold opacity-75">Sources:</p>
                            {message.sources.map((source, idx) => (
                              <a
                                key={idx}
                                href={source.referenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-2 text-xs hover:opacity-75 transition-opacity"
                              >
                                <ExternalLink className="w-3 h-3 mt-0.5 shrink-0" />
                                <span>{source.title}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-muted border border-border">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Analyzing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input Area */}
            <div className="border-t border-border p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Ask me anything about accounting, GST, taxes..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Suggested Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputValue(question);
                  }}
                  className="w-full text-left text-sm px-3 py-2.5 rounded-lg hover:bg-muted transition-colors border border-border text-muted-foreground hover:text-foreground"
                >
                  {question}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted border border-border'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Knowledge Base Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Knowledge Base</CardTitle>
              <CardDescription>Comprehensive financial resources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="text-muted-foreground text-xs mb-2">Coverage areas:</p>
                <div className="flex flex-wrap gap-2">
                  {['GST Rules', 'Tax Laws', 'Accounting', 'Compliance', 'Case Studies'].map((item) => (
                    <Badge key={item} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function generateMockResponse(question: string): string {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes('gst')) {
    return `Based on GST regulations, here are the key points:

1. **GST Registration**: Mandatory for businesses with annual turnover exceeding ₹40 lakhs (₹20 lakhs for specific states).

2. **Tax Rates**: GST has four tax slabs - 5%, 12%, 18%, and 28% - depending on the nature of goods/services supplied.

3. **Filing Requirements**: 
   - GSTR-1 (monthly outward supplies): Due by the 11th of next month
   - GSTR-3B (tax liability): Due by the 20th of next month
   - Annual return (GSTR-9): Due before December 31st

4. **Input Tax Credit (ITC)**: You can claim ITC on purchases made for business purposes, which reduces your tax liability.

5. **Compliance**: Maintain detailed records of all invoices and ensure accurate reporting to avoid penalties.

Would you like more specific information about any aspect?`;
  }

  if (lowerQuestion.includes('cash flow') || lowerQuestion.includes('liquidity')) {
    return `Cash flow management is critical for business sustainability. Here's what you should focus on:

**Key Metrics**:
- Operating Cash Flow: Cash generated from core business operations
- Free Cash Flow: Available for distribution to investors
- Cash Conversion Cycle: Time taken to convert investments back to cash

**Best Practices**:
1. Accelerate customer collections - Offer early payment discounts
2. Optimize inventory - Reduce tied-up capital
3. Negotiate payment terms - Extend payables when possible
4. Monitor DSO (Days Sales Outstanding) - Keep it below 45 days
5. Maintain cash reserves - 3-6 months of operating expenses

**Red Flags**:
- Increasing receivables without corresponding revenue growth
- Negative free cash flow despite profitability
- Decreasing cash balance trend

Let me know if you'd like to dive deeper into any area!`;
  }

  if (lowerQuestion.includes('tax') || lowerQuestion.includes('deduction')) {
    return `Tax optimization is an important part of financial planning. Here are the main deductions available:

**Business Deductions**:
- Salaries and wages for employees
- Rent for business premises
- Utilities and supplies
- Professional fees (accounting, legal, consulting)
- Travel and accommodation expenses
- Vehicle expenses (depreciation or mileage)
- Insurance premiums
- Interest on business loans
- Depreciation on fixed assets

**Important Notes**:
1. All expenses must be wholly and exclusively for business purposes
2. Keep detailed records and documentation
3. Section 80C deductions (up to ₹1.5L) for investments
4. Section 80D deductions for health insurance
5. HRA deduction if applicable

**Planning Tips**:
- Time major purchases for tax efficiency
- Review deductions quarterly
- Consider entity structure (Sole proprietorship vs. Company)
- Consult with CA for personalized planning

Would you like help planning specific deductions?`;
  }

  return `Thank you for your question! Here's what I can help you with:

**Accounting & Bookkeeping**:
- Journal entry guidance
- Trial balance and reconciliation
- Account classification

**Financial Statements**:
- Profit & Loss preparation
- Balance sheet analysis
- Cash flow statements
- Financial ratios

**GST & Compliance**:
- Filing requirements and deadlines
- Rate classifications
- Return procedures

**Tax Planning**:
- Deduction strategies
- Entity structure optimization
- Tax-efficient investments

**Risk Analysis**:
- Liquidity assessment
- Operational efficiency
- Compliance status

Please ask me a specific question, and I'll provide detailed guidance with references to relevant regulations and best practices.`;
}
