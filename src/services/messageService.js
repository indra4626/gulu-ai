// src/services/messageService.js
// CRUD operations for encrypted messages via Supabase

import { supabase } from './supabase';
import { encryptData, decryptData } from '../utils/cryptoUtils';

/**
 * Load all messages for the current user, decrypt them.
 */
export const loadMessages = async (cryptoKey) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  const decrypted = await Promise.all(
    data.map(async (msg) => {
      const content = await decryptData(cryptoKey, msg.encrypted_content);
      return {
        id: msg.id,
        role: msg.role,
        content: content || '[decryption failed]',
        emotion: msg.emotion,
        timestamp: new Date(msg.created_at).getTime(),
      };
    })
  );

  return decrypted;
};

/**
 * Save a new message (encrypted) to Supabase.
 */
export const saveMessage = async (cryptoKey, userId, role, content, emotion = 'neutral') => {
  const encrypted = await encryptData(cryptoKey, content);

  const { data, error } = await supabase
    .from('messages')
    .insert({
      user_id: userId,
      role,
      encrypted_content: encrypted,
      emotion,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    role: data.role,
    content,
    emotion: data.emotion,
    timestamp: new Date(data.created_at).getTime(),
  };
};

/**
 * Delete all messages for the current user.
 */
export const clearAllMessages = async (userId) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
};

/**
 * Save/update user profile (encrypted).
 */
export const saveProfile = async (cryptoKey, userId, profile, summary) => {
  const encryptedProfile = await encryptData(cryptoKey, JSON.stringify(profile));
  const encryptedSummary = await encryptData(cryptoKey, summary || '');

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      encrypted_profile: encryptedProfile,
      encrypted_summary: encryptedSummary,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
};

/**
 * Load user profile (decrypt).
 */
export const loadProfile = async (cryptoKey, userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return { profile: {}, summary: '' };

  const profileStr = data.encrypted_profile ? await decryptData(cryptoKey, data.encrypted_profile) : null;
  const summary = data.encrypted_summary ? await decryptData(cryptoKey, data.encrypted_summary) : '';

  return {
    profile: profileStr ? JSON.parse(profileStr) : {},
    summary: summary || '',
  };
};

/**
 * Subscribe to real-time new messages.
 */
export const subscribeToMessages = (userId, callback) => {
  return supabase
    .channel('messages-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};
