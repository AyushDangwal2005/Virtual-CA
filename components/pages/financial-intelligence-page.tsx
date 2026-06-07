'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Newspaper,
  RefreshCw,
  Filter,
  ExternalLink,
  Target,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  category: 'gst' | 'tax' | 'business' | 'compliance';
  date: string;
  url: string;
}

interface FinancialIntelligencePageProps {
  onBack: () => void;
}

export default function FinancialIntelligencePage({ onBack }: FinancialIntelligencePageProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock market data
  const marketIndices: MarketData[] = [
    { symbol: 'NIFTY', name: 'Nifty 50', price: 19250, change: 125, changePercent: 0.65 },
    { symbol: 'SENSEX', name: 'BSE Sensex', price: 65450, change: 350, changePercent: 0.54 },
    { symbol: 'BANKNIFTY', name: 'Bank Nifty', price: 48750, change: 250, changePercent: 0.52 },
    { symbol: 'IT', name: 'Nifty IT', price: 32100, change: -50, changePercent: -0.16 },
  ];

  const stocks: MarketData[] = [
    { symbol: 'INFY', name: 'Infosys', price: 1450, change: 25, changePercent: 1.75 },
    { symbol: 'TCS', name: 'Tata Consultancy', price: 4320, change: -15, changePercent: -0.35 },
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: 3150, change: 45, changePercent: 1.45 },
    { symbol: 'HDFC', name: 'HDFC Bank', price: 1920, change: 30, changePercent: 1.59 },
  ];

  const newsItems: NewsItem[] = [
    {
      id: '1',
      title: 'New GST Rate Changes Announced for Electronics',
      description: 'The GST Council has reduced the GST rate on electronics from 18% to 12% effective next quarter to boost the manufacturing sector.',
      source: 'Financial Express',
      category: 'gst',
      date: '2024-06-07',
      url: '#',
    },
    {
      id: '2',
      title: 'Income Tax Slab Revision for FY 2024-25',
      description: 'New income tax slabs announced with standard deduction increased to ₹75,000 for individuals under new tax regime.',
      source: 'Times of India',
      category: 'tax',
      date: '2024-06-06',
      url: '#',
    },
    {
      id: '3',
      title: 'Nifty 50 Hits All-Time High',
      description: 'Indian stock market continues its bullish streak with Nifty reaching new milestone supported by strong corporate earnings.',
      source: 'Moneycontrol',
      category: 'business',
      date: '2024-06-05',
      url: '#',
    },
    {
      id: '4',
      title: 'Compliance Deadline Extended for GST Returns',
      description: 'GSTN has extended the GSTR-1 filing deadline for certain businesses to ease compliance burden.',
      source: 'Business Today',
      category: 'compliance',
      date: '2024-06-04',
      url: '#',
    },
    {
      id: '5',
      title: 'RBI Keeps Policy Rate Unchanged',
      description: 'Reserve Bank of India maintains repo rate at 6.5% citing inflation concerns, but hints at possible rate cuts ahead.',
      source: 'Economic Times',
      category: 'business',
      date: '2024-06-03',
      url: '#',
    },
    {
      id: '6',
      title: 'New Audit Framework Released',
      description: 'ICAI releases updated audit standards for FY 2024-25 with emphasis on digital audit and blockchain verification.',
      source: 'CA Journal',
      category: 'compliance',
      date: '2024-06-02',
      url: '#',
    },
  ];

  const marketTrend = [
    { date: 'Jun 1', nifty: 19100, sensex: 64850, it: 32200 },
    { date: 'Jun 2', nifty: 19150, sensex: 65050, it: 32100 },
    { date: 'Jun 3', nifty: 19180, sensex: 65200, it: 32050 },
    { date: 'Jun 4', nifty: 19220, sensex: 65320, it: 32150 },
    { date: 'Jun 5', nifty: 19240, sensex: 65400, it: 32080 },
    { date: 'Jun 6', nifty: 19250, sensex: 65450, it: 32100 },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'gst':
        return 'bg-blue-100 text-blue-800';
      case 'tax':
        return 'bg-purple-100 text-purple-800';
      case 'business':
        return 'bg-green-100 text-green-800';
      case 'compliance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNews =
    selectedCategory === 'all'
      ? newsItems
      : newsItems.filter((item) => item.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight">Financial Intelligence</h2>
          <p className="text-muted-foreground mt-1.5 text-sm">Live market data, news, and financial analytics</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="gap-2" disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="market" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="market">Market Data</TabsTrigger>
          <TabsTrigger value="news">News & Updates</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        {/* Market Data Tab */}
        <TabsContent value="market" className="space-y-6 mt-6">
          {/* Market Indices */}
          <Card>
            <CardHeader>
              <CardTitle>Market Indices</CardTitle>
              <CardDescription>Real-time trading data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketIndices.map((index) => (
                  <div
                    key={index.symbol}
                    className="border border-border rounded-lg p-4 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{index.name}</p>
                        <p className="text-xs text-muted-foreground">{index.symbol}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-light">{index.price.toLocaleString('en-IN')}</p>
                        <div
                          className={`flex items-center gap-1 text-sm font-medium ${
                            index.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {index.change >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {index.change > 0 ? '+' : ''}
                          {index.change} ({index.changePercent > 0 ? '+' : ''}
                          {index.changePercent}%)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stock Prices */}
          <Card>
            <CardHeader>
              <CardTitle>Top Stocks</CardTitle>
              <CardDescription>Selected stocks for reference</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stocks.map((stock) => (
                  <div key={stock.symbol} className="border border-border rounded-lg p-4 hover:bg-muted transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{stock.name}</p>
                        <p className="text-xs text-muted-foreground">{stock.symbol}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-light">₹{stock.price}</p>
                        <div
                          className={`flex items-center gap-1 text-sm font-medium ${
                            stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {stock.change >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {stock.change > 0 ? '+' : ''}
                          {stock.change} ({stock.changePercent > 0 ? '+' : ''}
                          {stock.changePercent}%)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>6-Day Market Trend</CardTitle>
              <CardDescription>Index movements over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={marketTrend}>
                  <defs>
                    <linearGradient id="colorNifty" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSensex" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="nifty"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorNifty)"
                    name="Nifty 50"
                  />
                  <Area
                    type="monotone"
                    dataKey="sensex"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorSensex)"
                    name="Sensex"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Market Sentiment */}
          <Card>
            <CardHeader>
              <CardTitle>Market Sentiment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Sentiment</span>
                    <Badge className="bg-green-100 text-green-800">Bullish</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Markets showing positive momentum with strong corporate earnings and stable macro environment.
                  </p>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Volatility Index</span>
                    <span className="font-semibold">18.5</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Low volatility indicating stable market conditions. Investors should remain cautious on major policy decisions.
                  </p>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium">FII Activity</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    FIIs have been net buyers recently. Watch for policy changes and global rate scenarios.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* News Tab */}
        <TabsContent value="news" className="space-y-6 mt-6">
          {/* News Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            <Button
              variant={selectedCategory === 'gst' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('gst')}
              className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
            >
              GST Updates
            </Button>
            <Button
              variant={selectedCategory === 'tax' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('tax')}
              className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200"
            >
              Tax News
            </Button>
            <Button
              variant={selectedCategory === 'business' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('business')}
              className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
            >
              Business News
            </Button>
            <Button
              variant={selectedCategory === 'compliance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('compliance')}
              className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200"
            >
              Compliance
            </Button>
          </div>

          {/* News Items */}
          <div className="space-y-4">
            {filteredNews.map((news) => (
              <Card key={news.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs ${getCategoryBadgeColor(news.category)}`}>
                          {news.category.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(news.date).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <h4 className="font-semibold text-lg mb-2 leading-snug text-balance">
                        {news.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {news.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          {news.source}
                        </span>
                        <a
                          href={news.url}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          Read More
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <Newspaper className="w-8 h-8 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Analysis & Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-l-4 border-green-600 pl-4 py-2">
                  <h4 className="font-semibold text-sm mb-1">Strong Corporate Earnings</h4>
                  <p className="text-sm text-muted-foreground">
                    Q1 FY2025 earnings from major IT and financial services companies have exceeded expectations, supporting market rally.
                  </p>
                </div>

                <div className="border-l-4 border-orange-600 pl-4 py-2">
                  <h4 className="font-semibold text-sm mb-1">RBI Policy Watch</h4>
                  <p className="text-sm text-muted-foreground">
                    Inflation remains elevated but trending downward. Rate cuts likely in H2 FY2025. Monitor monthly inflation data.
                  </p>
                </div>

                <div className="border-l-4 border-blue-600 pl-4 py-2">
                  <h4 className="font-semibold text-sm mb-1">Government Initiatives</h4>
                  <p className="text-sm text-muted-foreground">
                    Make in India and PLI schemes showing positive impact on domestic manufacturing. Capex cycle gaining momentum.
                  </p>
                </div>

                <div className="border-l-4 border-purple-600 pl-4 py-2">
                  <h4 className="font-semibold text-sm mb-1">GST Policy Updates</h4>
                  <p className="text-sm text-muted-foreground">
                    Recent GST rate rationalizations are expected to boost consumer demand and improve business margins. Keep updated on GSTN notifications.
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Key Metrics to Monitor
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">FPI Flows</p>
                    <p className="font-semibold mt-1">Track weekly FPI data for market sentiment</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">IIP & Inflation</p>
                    <p className="font-semibold mt-1">Monitor Industrial Production and CPI releases</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">USD/INR Rate</p>
                    <p className="font-semibold mt-1">Track forex trends affecting IT and export sectors</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">Global Cues</p>
                    <p className="font-semibold mt-1">Watch US Fed decisions and oil price movements</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
