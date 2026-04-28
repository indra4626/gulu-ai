// src/services/moodService.js
import { supabase } from './supabase';
import { encryptData, decryptData } from '../utils/cryptoUtils';

export const saveMoodEntry = async (cryptoKey, userId, mood, score, note, triggers) => {
  const encNote = note ? await encryptData(cryptoKey, note) : null;
  const { data, error } = await supabase
    .from('mood_entries')
    .insert({ user_id: userId, mood, mood_score: score, encrypted_note: encNote, triggers })
    .select().single();
  if (error) throw error;
  return { ...data, note };
};

export const loadMoodHistory = async (cryptoKey, days = 30) => {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });
  if (error) throw error;
  return Promise.all((data || []).map(async (m) => {
    const note = m.encrypted_note ? await decryptData(cryptoKey, m.encrypted_note) : '';
    return { ...m, note };
  }));
};

// ============ PROJECTS ============

export const saveProject = async (cryptoKey, userId, name, description, priority, deadline) => {
  const encName = await encryptData(cryptoKey, name);
  const encDesc = description ? await encryptData(cryptoKey, description) : '';
  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: userId, encrypted_name: encName, encrypted_description: encDesc, priority, deadline: deadline?.toISOString() })
    .select().single();
  if (error) throw error;
  return { ...data, name, description };
};

export const loadProjects = async (cryptoKey) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return Promise.all((data || []).map(async (p) => {
    const name = await decryptData(cryptoKey, p.encrypted_name);
    const desc = p.encrypted_description ? await decryptData(cryptoKey, p.encrypted_description) : '';
    return { ...p, name: name || '[encrypted]', description: desc };
  }));
};

export const updateProjectStatus = async (projectId, status) => {
  const { error } = await supabase.from('projects').update({ status, updated_at: new Date().toISOString() }).eq('id', projectId);
  if (error) throw error;
};

export const deleteProject = async (projectId) => {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
};
