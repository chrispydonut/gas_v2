// lib/chat.ts

import { supabase } from './supabase';

// 대화 찾기 또는 만들기 
export async function getOrCreateConversation(userId: string, adminId: string) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('admin_id', adminId)
    .single();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, admin_id: adminId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 메시지 전송 함수
export async function sendMessage(conversationId: string, senderId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      });
  
    if (error) throw error;
    return data;
  }

// 메시지 목록 불러오기
export async function fetchMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
  
    if (error) throw error;
    return data;
  }
  