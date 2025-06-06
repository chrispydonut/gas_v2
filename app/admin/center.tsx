import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AdminCenter() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [adminId, setAdminId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);
  const router = useRouter();
  const { conversation_id } = useLocalSearchParams();

  // adminId 먼저 설정
  useEffect(() => {
    const getAdminId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) {
        setAdminId(data.user.id);
      }
    };
    getAdminId();
  }, []);

  // adminId, conversation_id가 준비된 이후 실행
  useEffect(() => {
    if (!adminId || !conversation_id) return;

    const initChat = async () => {
      // 관리자 자동 할당
      const { data: conv } = await supabase
        .from('conversations')
        .select('admin_id')
        .eq('id', conversation_id)
        .single();

      if (!conv?.admin_id) {
        await supabase
          .from('conversations')
          .update({ admin_id: adminId })
          .eq('id', conversation_id);
      }

      // 기존 메시지 로딩
      const { data: initialMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation_id)
        .order('created_at');

      setMessages(initialMsgs || []);

      // 기존 채널 제거
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // 실시간 채널 구독
      const channel = supabase
        .channel(`chat-${conversation_id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversation_id}`,
          },
          (payload) => {
            const newMessage = payload.new;
            setMessages((prev) => [...prev, newMessage]);
            setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
          }
        )
        .subscribe((status) => {
          console.log('✅ 채널 상태:', status);
        });

      channelRef.current = channel;
    };

    initChat();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [adminId, conversation_id]);

  const handleSend = async () => {
    if (!input.trim() || !conversation_id || !adminId) return;

    await supabase.from('messages').insert({
      conversation_id,
      sender_id: adminId,
      content: input.trim(),
    });

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation_id);

    setInput('');
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  if (!adminId) return null;

  return (
    <View className="flex-1 bg-white pt-8">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="pt-10 flex-row items-center justify-between px-5 pb-2">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text className="text-[22px] font-bold text-[#222]">고객센터</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            className={`px-4 my-1 ${
              item.sender_id === adminId ? 'items-end' : 'items-start'
            }`}
          >
            <View
              className={`rounded-2xl py-2 px-3 max-w-[80%] ${
                item.sender_id === adminId ? 'bg-[#EB5A36]' : 'bg-[#F6F7FB]'
              }`}
            >
              <Text
                className={`text-[15px] leading-[22px] ${
                  item.sender_id === adminId ? 'text-white' : 'text-[#222]'
                }`}
              >
                {item.content}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd?.()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-row items-center p-3 bg-white mb-8">
          <Ionicons name="add" size={24} color="#222" className="mr-2" />
          <View className="flex-1 bg-[#F6F7FB] rounded-full px-4 py-1.5">
            <TextInput
              placeholder="메시지를 입력해주세요."
              value={input}
              onChangeText={setInput}
              className="text-[15px] text-[#222]"
              multiline
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
          </View>
          <TouchableOpacity onPress={handleSend} className="ml-2">
            <Ionicons
              name="arrow-up-circle"
              size={28}
              color={input.trim() ? '#EB5A36' : '#ccc'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
