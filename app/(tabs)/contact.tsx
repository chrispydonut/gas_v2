import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Inquiry() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('conversations')
        .select('id, updated_at, messages(content, created_at)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('대화 불러오기 실패:', error.message);
      } else {
        setConversations(data || []);
      }

      setLoading(false);
    };

    fetchConversations();
  }, []);

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday
      ? date.toTimeString().slice(0, 5)
      : date.toISOString().slice(0, 10).replace(/-/g, '/');
  };

  return (
    <View className="flex-1 bg-white">
      {/* 상단 헤더 */}
      <View className="pt-20 flex-row items-center justify-between px-[18px] mb-3">
        <TouchableOpacity onPress={() => router.replace('/')}> 
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text className="text-[22px] font-bold text-[#222]">문의하기</Text>
        <TouchableOpacity onPress={() => router.push('/service/center')}>
          <Ionicons name="create-outline" size={26} color="#222" />
        </TouchableOpacity>
      </View>

      {/* 문의 내역 리스트 */}
      {loading ? (
        <ActivityIndicator className="mt-10" />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => {
            const latestMessage = item.messages?.[item.messages.length - 1];
            return (
              <TouchableOpacity
                onPress={() => router.push(`/service/center?conversation_id=${item.id}`)}
                className="px-5 py-4 border-b border-[#eee]"
              >
                <View className="flex-row justify-between items-center">
                  <Text className="font-bold text-[16px] text-[#222]">문의 내역</Text>
                  <Text className="text-[#888] text-[13px]">
                    {latestMessage ? formatTime(latestMessage.created_at) : formatTime(item.updated_at)}
                  </Text>
                </View>
                <Text className="text-[#888] text-[13px] mt-1">
                  {latestMessage?.content || '(메시지 없음)'}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
