import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

export default function AdminInquiry() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      // 로그인된 유저 정보 가져오기
    const getUserId = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('유저 정보 불러오기 실패:', error.message);
      } else {
        console.log('로그인된 유저:', data.user);  // <-- 여기에서 user.id 찍힘
      }
    };
    getUserId();
        
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          store_id,
          updated_at,
          messages(content, created_at),
          stores(name)
        `)
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
    <View className="flex-1 bg-white pt-10">
      <View className="pt-10 flex-row items-center justify-between px-[18px] mb-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text className="text-[22px] font-bold text-[#222]">전체 문의</Text>
        <View style={{ width: 30 }} />
      </View>

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
                // ⬇️ 채팅방으로 이동!
                onPress={() => router.push(`/admin/center?conversation_id=${item.id}`)}
                className="px-5 py-4 border-b border-[#eee]"
              >
                <View className="flex-row justify-between items-center">
                  <Text className="font-bold text-[16px] text-[#222]">
                    {/* ⬇️ 가게 이름 표시 */}
                    {item.stores?.name || '(이름없음)'}
                  </Text>
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
