import { createClient } from './server';

// User operations
export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId: string, updates: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Invoice operations
export async function getInvoices(userId: string, limit = 50, offset = 0) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('invoice_date', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return data;
}

export async function getInvoice(userId: string, invoiceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .eq('id', invoiceId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createInvoice(userId: string, invoice: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .insert([{ ...invoice, user_id: userId }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateInvoice(userId: string, invoiceId: string, updates: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .update({ ...updates, updated_at: new Date() })
    .eq('user_id', userId)
    .eq('id', invoiceId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Journal Entry operations
export async function getJournalEntries(userId: string, limit = 100, offset = 0) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return data;
}

export async function createJournalEntry(userId: string, entry: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('journal_entries')
    .insert([{ ...entry, user_id: userId }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Customer operations
export async function getCustomers(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createCustomer(userId: string, customer: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .insert([{ ...customer, user_id: userId }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Vendor operations
export async function getVendors(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createVendor(userId: string, vendor: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vendors')
    .insert([{ ...vendor, user_id: userId }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Document operations
export async function getDocuments(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createDocument(userId: string, doc: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('documents')
    .insert([{ ...doc, user_id: userId }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Knowledge base search (RAG)
export async function searchKnowledgeBase(query: string, limit = 10) {
  const supabase = await createClient();
  
  // For now, use text search - vector search requires embedding
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('id, title, content, category, source, reference_url')
    .textSearch('content', query)
    .limit(limit);
  
  if (error) {
    // Fallback if text search is not available
    const { data: fallback, error: fallbackError } = await supabase
      .from('knowledge_base')
      .select('id, title, content, category, source, reference_url')
      .ilike('content', `%${query}%`)
      .limit(limit);
    
    if (fallbackError) throw fallbackError;
    return fallback;
  }
  
  return data;
}

// Chat history
export async function addChatMessage(userId: string, message: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_history')
    .insert([{ ...message, user_id: userId }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getChatHistory(userId: string, limit = 50) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

// Financial metrics
export async function getLatestMetrics(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('financial_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('metric_date', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}

export async function createMetrics(userId: string, metrics: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('financial_metrics')
    .insert([{ ...metrics, user_id: userId }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Recommendations
export async function getRecommendations(userId: string, unreadOnly = false) {
  const supabase = await createClient();
  let query = supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', userId);
  
  if (unreadOnly) {
    query = query.eq('is_read', false);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function markRecommendationRead(recommendationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recommendations')
    .update({ is_read: true, updated_at: new Date() })
    .eq('id', recommendationId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
