import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Inquiry() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useFocusEffect(
  useCallback(() => {
    let isActive = true;

    const fetchConversations = async () => {
      setLoading(true);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', userData.user?.id).single();
      console.log("profileData", profileData);
      setProfile(profileData);
      if (userError) {
        console.warn('유저 정보 불러오기 실패:', userError.message);
        setLoading(false);
        return;
      }

      const userId = userData.user?.id;
      console.log('🔍 현재 유저 ID:', userId);

      if (!userId) {
        console.warn('❗ 유저 ID 없음 — 로그인 상태 확인 필요');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('id, updated_at, messages(content, created_at)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (isActive) {
        if (error) {
          console.warn('대화 불러오기 실패:', error.message);
        } else {
          setConversations(data || []);
        }
        setLoading(false);
      }
    };

    fetchConversations();

    return () => {
      isActive = false;
    };
  }, [])
);
  

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday
      ? date.toTimeString().slice(0, 5)
      : date.toISOString().slice(0, 10).replace(/-/g, '/');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 상단 헤더 */}
      <View className="pt-4 flex-row items-center justify-between px-[18px] mb-3">
        <TouchableOpacity onPress={() => router.replace('/')}> 
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text className="text-[22px] font-bold text-[#222]">문의하기</Text>
        <TouchableOpacity
          onPress={async () => {
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData.user?.id;
            if (!userId) return;

            // 이미 진행 중인 빈 대화가 있는지 확인
            const { data: existing } = await supabase
              .from('conversations')
              .select('id')
              .eq('user_id', userId)
              .is('admin_id', 'f0887d78-02cc-4e94-a9a5-76baf8bac9f4') // 아직 할당되지 않은
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            let conversationId = existing?.id;

            // 없으면 새로 생성
            if (!conversationId) {
              const { data: created, error } = await supabase
                .from('conversations')
                .insert({ user_id: userId, admin_id: 'f0887d78-02cc-4e94-a9a5-76baf8bac9f4', store_id: profile?.default_store_id })
                .select()
                .single();

              if (error || !created) {
                console.warn('새 문의 생성 실패:', error?.message);
                return;
              }

              conversationId = created.id;
            }

            router.push(`/service/center?conversation_id=${conversationId}`);
          }}
        >
          <Ionicons name="create-outline" size={26} color="#222" />
        </TouchableOpacity>
      </View>

      {/* 문의 내역 리스트 */}
      {loading ? (
        <ActivityIndicator className="mt-10 text-[#222]" />
      ) : (
        conversations.length > 0 ? (
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
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="text-[#888] text-[14px]">문의 내역이 없습니다.</Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
}
