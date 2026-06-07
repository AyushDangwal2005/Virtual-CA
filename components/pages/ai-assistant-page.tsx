'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAIChat } from '@/lib/hooks/useAIChat';

interface AssistantPageProps {
  onBack: () => void;
}

export default function AIAssistantPage({ onBack }: AssistantPageProps) {
  const { messages, loading, error, sendMessage } = useAIChat();
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const message = inputValue.trim();
    
    // Determine category from message content
    const lowerInput = message.toLowerCase();
    let category = selectedCategory;
    if (category === 'general') {
      if (lowerInput.includes('gst') || lowerInput.includes('tax')) category = 'gst';
      else if (lowerInput.includes('accounting') || lowerInput.includes('invoice')) category = 'accounting';
    }

    setInputValue('');
    await sendMessage(message, category);
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
                  {loading && (
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
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading} size="icon">
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
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === cat.id
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
