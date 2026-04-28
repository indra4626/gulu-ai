// src/services/memoryBankService.js
import { supabase } from './supabase';
import { encryptData, decryptData } from '../utils/cryptoUtils';

// ==================== MEMORIES ====================

export const saveMemory = async (cryptoKey, userId, content, category, isPinned = false, sourceId = null) => {
  const encrypted = await encryptData(cryptoKey, content);
  const { data, error } = await supabase
    .from('memories')
    .insert({ user_id: userId, encrypted_content: encrypted, category, is_pinned: isPinned, source_message_id: sourceId })
    .select()
    .single();
  if (error) throw error;
  return { ...data, content };
};

export const loadMemories = async (cryptoKey) => {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return Promise.all((data || []).map(async (m) => {
    const content = await decryptData(cryptoKey, m.encrypted_content);
    return { ...m, content: content || '[encrypted]' };
  }));
};

export const togglePinMemory = async (memoryId, isPinned) => {
  const { error } = await supabase.from('memories').update({ is_pinned: isPinned }).eq('id', memoryId);
  if (error) throw error;
};

export const deleteMemory = async (memoryId) => {
  const { error } = await supabase.from('memories').delete().eq('id', memoryId);
  if (error) throw error;
};

// ==================== REMINDERS ====================

export const saveReminder = async (cryptoKey, userId, content, type, triggerDate) => {
  const encrypted = await encryptData(cryptoKey, content);
  const { data, error } = await supabase
    .from('reminders')
    .insert({ user_id: userId, encrypted_content: encrypted, reminder_type: type, trigger_date: triggerDate?.toISOString() })
    .select()
    .single();
  if (error) throw error;
  return { ...data, content };
};

export const loadReminders = async (cryptoKey) => {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('is_completed', false)
    .order('trigger_date', { ascending: true });
  if (error) throw error;

  return Promise.all((data || []).map(async (r) => {
    const content = await decryptData(cryptoKey, r.encrypted_content);
    return { ...r, content: content || '[encrypted]' };
  }));
};

export const completeReminder = async (reminderId) => {
  const { error } = await supabase.from('reminders').update({ is_completed: true }).eq('id', reminderId);
  if (error) throw error;
};

// ==================== TOPIC STATS ====================

export const getTopicStatsFromDB = async () => {
  const { data, error } = await supabase
    .from('messages')
    .select('topic');
  if (error) throw error;

  const counts = {};
  (data || []).forEach(m => {
    const t = m.topic || 'general';
    counts[t] = (counts[t] || 0) + 1;
  });
  return counts;
};
