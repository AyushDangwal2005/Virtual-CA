'use client';

import React, { useState, useCallback } from 'react';
import {
  FileUp,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  customerName: string;
  totalAmount: number;
  gstAmount: number;
  invoiceDate: string;
  dueDate: string;
  paymentStatus: 'pending' | 'partial' | 'paid';
}

interface InvoiceManagerPageProps {
  onBack: () => void;
}

export default function InvoiceManagerPage({ onBack }: InvoiceManagerPageProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [uploading, setUploading] = useState(false);

  // Mock invoice data
  const mockInvoices: Invoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-2024-001',
      vendorName: 'Tech Supplies Ltd',
      customerName: 'Your Company',
      totalAmount: 50000,
      gstAmount: 9000,
      invoiceDate: '2024-06-01',
      dueDate: '2024-06-30',
      paymentStatus: 'pending',
    },
    {
      id: '2',
      invoiceNumber: 'INV-2024-002',
      vendorName: 'Office Solutions Inc',
      customerName: 'Your Company',
      totalAmount: 25000,
      gstAmount: 4500,
      invoiceDate: '2024-05-15',
      dueDate: '2024-06-14',
      paymentStatus: 'paid',
    },
    {
      id: '3',
      invoiceNumber: 'INV-2024-003',
      vendorName: 'Digital Marketing Pro',
      customerName: 'Your Company',
      totalAmount: 75000,
      gstAmount: 13500,
      invoiceDate: '2024-04-20',
      dueDate: '2024-05-20',
      paymentStatus: 'overdue',
    },
  ];

  if (invoices.length === 0) {
    setInvoices(mockInvoices);
  }

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.vendorName.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'pending') return inv.paymentStatus === 'pending' && matchesSearch;
    if (activeTab === 'paid') return inv.paymentStatus === 'paid' && matchesSearch;
    if (activeTab === 'overdue') return inv.paymentStatus === 'overdue' && matchesSearch;
    return matchesSearch;
  });

  const handleUploadFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Mock file upload
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert(`File "${file.name}" uploaded successfully!`);
      setShowUploadDialog(false);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const analytics = {
    total: invoices.length,
    paid: invoices.filter((i) => i.paymentStatus === 'paid').length,
    pending: invoices.filter((i) => i.paymentStatus === 'pending').length,
    overdue: invoices.filter((i) => i.paymentStatus === 'overdue').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
    paidAmount: invoices.filter((i) => i.paymentStatus === 'paid').reduce((sum, i) => sum + i.totalAmount, 0),
    pendingAmount: invoices.filter((i) => i.paymentStatus === 'pending').reduce((sum, i) => sum + i.totalAmount, 0),
    gstCollected: invoices.reduce((sum, i) => sum + i.gstAmount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight">Invoice Manager</h2>
          <p className="text-muted-foreground mt-1.5 text-sm">Upload, extract, and manage invoices with AI-powered processing</p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
          <FileUp className="w-4 h-4" />
          Upload Invoice
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Invoices</p>
            <p className="text-2xl font-light mt-2">{analytics.total}</p>
            <p className="text-xs text-muted-foreground mt-1.5">₹{(analytics.totalAmount / 100000).toFixed(1)}L total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Paid</p>
            <p className="text-2xl font-light mt-2 text-green-600">{analytics.paid}</p>
            <p className="text-xs text-muted-foreground mt-1.5">₹{(analytics.paidAmount / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-light mt-2 text-yellow-600">{analytics.pending}</p>
            <p className="text-xs text-muted-foreground mt-1.5">₹{(analytics.pendingAmount / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">GST Collected</p>
            <p className="text-2xl font-light mt-2">₹{(analytics.gstCollected / 100000).toFixed(1)}L</p>
            <p className="text-xs text-muted-foreground mt-1.5">{analytics.total > 0 && `${((analytics.gstCollected / analytics.totalAmount) * 100).toFixed(0)}% average`}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number or vendor name..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Invoices List with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Manage and track all your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                All ({analytics.total})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({analytics.pending})
              </TabsTrigger>
              <TabsTrigger value="paid">
                Paid ({analytics.paid})
              </TabsTrigger>
              <TabsTrigger value="overdue">
                Overdue ({analytics.overdue})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm">No invoices found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>GST</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.vendorName}</TableCell>
                          <TableCell>₹{(invoice.totalAmount / 1000).toFixed(0)}K</TableCell>
                          <TableCell>₹{(invoice.gstAmount / 1000).toFixed(0)}K</TableCell>
                          <TableCell>{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell>{getStatusBadge(invoice.paymentStatus)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Invoice</DialogTitle>
            <DialogDescription>Upload an invoice document (PDF, Image, or Excel)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
                onChange={handleUploadFile}
                className="hidden"
                id="file-input"
                disabled={uploading}
              />
              <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-2">
                <FileUp className="w-8 h-8 text-muted-foreground" />
                <p className="font-medium text-sm">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG, XLSX, CSV</p>
              </label>
            </div>
            {uploading && (
              <div className="flex items-center gap-2 justify-center py-4">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Processing with OCR...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Details Dialog */}
      {selectedInvoice && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedInvoice.invoiceNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Vendor</p>
                  <p className="font-medium mt-1">{selectedInvoice.vendorName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Customer</p>
                  <p className="font-medium mt-1">{selectedInvoice.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Invoice Date</p>
                  <p className="font-medium mt-1">{new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Due Date</p>
                  <p className="font-medium mt-1">{new Date(selectedInvoice.dueDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{(selectedInvoice.totalAmount - selectedInvoice.gstAmount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST</span>
                    <span className="font-medium">₹{selectedInvoice.gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-medium">Total Amount</span>
                    <span className="font-semibold text-lg">₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Status</p>
                <div className="mt-2">{getStatusBadge(selectedInvoice.paymentStatus)}</div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1">Mark as Paid</Button>
                <Button variant="outline" className="flex-1">Download</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
