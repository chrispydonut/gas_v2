import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface InquiryResponse {
  id: string;
  content: string;
  created_at: string;
  admin_id: string | null;
  is_internal_note: boolean;
}

interface InquiryDetail {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  stores?: {
    name: string;
  };
  inquiry_responses: InquiryResponse[];
}

export default function InquiryDetail() {
  const router = useRouter();
  const { inquiry_id } = useLocalSearchParams();
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case '접수됨': return '#FF9500';
      case '처리중': return '#007AFF';
      case '완료': return '#34C759';
      case '보류': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '높음': return '#FF3B30';
      case '보통': return '#FF9500';
      case '낮음': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const fetchInquiryDetail = async () => {
    if (!inquiry_id) return;

    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          id,
          title,
          content,
          category,
          status,
          priority,
          created_at,
          updated_at,
          stores(name),
          inquiry_responses(
            id,
            content,
            created_at,
            admin_id,
            is_internal_note
          )
        `)
        .eq('id', inquiry_id)
        .single();

      if (error) {
        console.error('문의글 상세 정보 불러오기 실패:', error);
        return;
      }

      // 답변을 생성일시 순으로 정렬
      if (data.inquiry_responses) {
        data.inquiry_responses.sort((a: InquiryResponse, b: InquiryResponse) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }

      const formattedData = {
        ...data,
        stores: Array.isArray(data.stores) ? data.stores[0] : data.stores
      };
      setInquiry(formattedData as InquiryDetail);
    } catch (error) {
      console.error('문의글 상세 정보 불러오기 중 오류:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInquiryDetail();
  }, [inquiry_id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInquiryDetail();
  };

  const formatDateTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EB5A36" />
        </View>
      </SafeAreaView>
    );
  }

  if (!inquiry) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 justify-center items-center">
          <Text className="text-[#888] text-[16px]">문의글을 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* 헤더 */}
      <View className="pt-4 flex-row items-center justify-between px-5 pb-4 border-b border-[#eee]">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-[#222]">문의 상세</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 문의글 정보 */}
        <View className="px-5 py-4 border-b border-[#eee]">
          {/* 상태 및 우선순위 */}
          <View className="flex-row items-center mb-3">
            <View 
              className="px-3 py-1 rounded-full mr-2"
              style={{ backgroundColor: getStatusColor(inquiry.status) + '20' }}
            >
              <Text 
                className="text-[12px] font-medium"
                style={{ color: getStatusColor(inquiry.status) }}
              >
                {inquiry.status}
              </Text>
            </View>
            <View 
              className="px-3 py-1 rounded-full mr-2"
              style={{ backgroundColor: getPriorityColor(inquiry.priority) + '20' }}
            >
              <Text 
                className="text-[12px] font-medium"
                style={{ color: getPriorityColor(inquiry.priority) }}
              >
                {inquiry.priority}
              </Text>
            </View>
            <Text className="text-[#888] text-[12px]">
              {inquiry.category}
            </Text>
          </View>

          {/* 제목 */}
          <Text className="text-[20px] font-bold text-[#222] mb-3">
            {inquiry.title}
          </Text>

          {/* 메타 정보 */}
          <View className="flex-row items-center mb-4">
            <Ionicons name="time-outline" size={16} color="#888" />
            <Text className="text-[#888] text-[13px] ml-1 mr-4">
              {formatDateTime(inquiry.created_at)}
            </Text>
            {inquiry.stores?.name && (
              <>
                <Ionicons name="storefront-outline" size={16} color="#888" />
                <Text className="text-[#888] text-[13px] ml-1">
                  {inquiry.stores.name}
                </Text>
              </>
            )}
          </View>

          {/* 문의 내용 */}
          <View className="bg-[#f8f9fa] p-4 rounded-lg">
            <Text className="text-[#222] text-[15px] leading-6">
              {inquiry.content}
            </Text>
          </View>
        </View>

        {/* 답변 목록 */}
        <View className="px-5 py-4">
          <View className="flex-row items-center mb-4">
            <Ionicons name="chatbubbles-outline" size={20} color="#222" />
            <Text className="text-[18px] font-bold text-[#222] ml-2">
              답변 ({inquiry.inquiry_responses.length})
            </Text>
          </View>

          {inquiry.inquiry_responses.length > 0 ? (
            inquiry.inquiry_responses.map((response, index) => (
              <View key={response.id} className="mb-4">
                <View className="bg-[#eeeeee] bg-opacity-10 p-4 rounded-lg">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <Ionicons name="person-circle-outline" size={20} color="#EB5A36" />
                      <Text className="text-[#EB5A36] font-medium text-[14px] ml-2">
                        관리자
                      </Text>
                    </View>
                    <Text className="text-[#888] text-[12px]">
                      {formatDateTime(response.created_at)}
                    </Text>
                  </View>
                  <Text className="text-[#222] text-[15px] leading-6">
                    {response.content}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View className="flex-1 justify-center items-center py-12">
              <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
              <Text className="text-[#888] text-[16px] mt-4">
                아직 답변이 없습니다.
              </Text>
              <Text className="text-[#aaa] text-[14px] mt-2 text-center">
                관리자가 확인 후 답변을 등록해드립니다.
              </Text>
            </View>
          )}
        </View>

        {/* 하단 여백 */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

