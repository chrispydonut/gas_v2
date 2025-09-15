import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  user_id: string;
  stores?: {
    name: string;
  };
  inquiry_responses: InquiryResponse[];
}

export default function AdminInquiryDetail() {
  const router = useRouter();
  const { inquiry_id } = useLocalSearchParams();
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);

  const statuses = ['접수됨', '처리중', '완료', '보류'];

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

  useEffect(() => {
    const getAdminId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) {
        setAdminId(data.user.id);
      }
    };
    getAdminId();
  }, []);

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
          user_id,
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

  const updateStatus = async (newStatus: string) => {
    if (!inquiry || !inquiry_id) return;

    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: newStatus })
        .eq('id', inquiry_id);

      if (error) {
        Alert.alert('오류', '상태 변경에 실패했습니다.');
        return;
      }

      setInquiry({ ...inquiry, status: newStatus });
      Alert.alert('완료', `상태가 '${newStatus}'로 변경되었습니다.`);
    } catch (error) {
      Alert.alert('오류', '상태 변경 중 오류가 발생했습니다.');
    }
  };

  const submitResponse = async () => {
    if (!responseText.trim() || !inquiry_id || !adminId) {
      Alert.alert('알림', '답변 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('inquiry_responses')
        .insert({
          inquiry_id,
          admin_id: adminId,
          content: responseText.trim(),
          is_internal_note: false,
        });

      if (error) {
        Alert.alert('오류', '답변 등록에 실패했습니다.');
        return;
      }

      setResponseText('');
      Alert.alert('완료', '답변이 등록되었습니다.');
      fetchInquiryDetail(); // 새로고침
    } catch (error) {
      Alert.alert('오류', '답변 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
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
        <Text className="text-[20px] font-bold text-[#222]">문의 관리</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* 문의글 정보 */}
          <View className="px-5 py-4 border-b border-[#eee]">
            {/* 상태 변경 버튼들 */}
            <View className="mb-4">
              <Text className="text-[14px] font-medium text-[#222] mb-2">상태 변경</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {statuses.map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => updateStatus(status)}
                    className={`mr-3 px-3 py-2 rounded-full border ${
                      inquiry.status === status
                        ? 'border-[#EB5A36]'
                        : 'border-[#ddd]'
                    }`}
                    style={{
                      backgroundColor: inquiry.status === status 
                        ? getStatusColor(status) + '20' 
                        : 'white'
                    }}
                  >
                    <Text
                      className="text-[12px] font-medium"
                      style={{
                        color: inquiry.status === status 
                          ? getStatusColor(status) 
                          : '#666'
                      }}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 우선순위 및 카테고리 */}
            <View className="flex-row items-center mb-3">
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

            {inquiry.inquiry_responses.length > 0 && (
              inquiry.inquiry_responses.map((response, index) => (
                <View key={response.id} className="mb-4">
                  <View className="bg-[#dddddd] bg-opacity-10 p-4 rounded-lg">
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
            )}
          </View>
        </ScrollView>

        {/* 답변 작성 영역 */}
        <View className="border-t border-[#eee] p-4 bg-white">
          <Text className="text-[16px] font-medium text-[#222] mb-3">답변 작성</Text>
          <View className="flex-row items-end">
            <View className="flex-1 mr-3">
              <TextInput
                value={responseText}
                onChangeText={setResponseText}
                placeholder="답변을 입력해주세요..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="border border-[#ddd] rounded-lg px-3 py-2 text-[15px] text-[#222] min-h-[80px]"
                maxLength={1000}
              />
              <Text className="text-[#888] text-[12px] mt-1 text-right">
                {responseText.length}/1000
              </Text>
            </View>
            <TouchableOpacity
              onPress={submitResponse}
              disabled={submitting || !responseText.trim()}
              className={`px-4 py-3 rounded-lg ${
                submitting || !responseText.trim()
                  ? 'bg-[#ccc]'
                  : 'bg-[#EB5A36]'
              }`}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color="white" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

