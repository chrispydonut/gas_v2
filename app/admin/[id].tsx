import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const SERVICE_NAME_MAP: Record<string, string> = {
  burner: '화구 교체',
  valve: '밸브 교체',
  gas: '가스누출 검사',
  pipe: '배관 철거',
  alarm: '경보기 교체',
  center: '고객센터',
  contract: '정기계약 이용권',
  quote: '시공견적 문의',
};

export default function AdminStoreDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [store, setStore] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreAndRequests = async () => {
      // 1. 가게 정보 가져오기
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .single();

      if (storeError || !storeData) {
        console.warn('가게 조회 실패:', storeError?.message);
        setLoading(false);
        return;
      }

      setStore(storeData);

      // 2. 등록자 전화번호 가져오기
      const { data: userData } = await supabase
        .from('profiles') // 또는 'auth.users'
        .select('phone')
        .eq('id', storeData.user_id)
        .single();

      setPhone(userData?.phone || '');

      // 3. 해당 가게의 서비스 요청 가져오기
      const { data: requestData, error: requestError } = await supabase
        .from('service_requests')
        .select('id, status, created_at, services(name)')
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false });

      if (requestError) {
        console.warn('서비스 요청 불러오기 실패:', requestError.message);
      } else {
        setRequests(requestData || []);
      }

      setLoading(false);
    };

    if (id) fetchStoreAndRequests();
  }, [id]);

  return (
    <View className="flex-1 bg-white">
      {/* 상단 헤더 */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-4">
        <TouchableOpacity onPress={() => router.replace('/admin/admin-store')}>
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text className="text-[22px] font-bold text-[#222]">가게 정보</Text>
        <View className="w-[28px]" />
      </View>

      {loading ? (
        <ActivityIndicator className="mt-6" />
      ) : store ? (
        <ScrollView className="px-6 mt-4">
          {/* 가게 기본 정보 */}
          <View className="space-y-4 mb-8">
            <View>
              <Text className="text-gray-500 text-sm mb-1">가게 이름</Text>
              <Text className="text-base font-semibold text-[#222]">{store.name}</Text>
            </View>
            <View>
              <Text className="text-gray-500 text-sm mb-1">위치</Text>
              <Text className="text-base text-[#222]">{store.address}</Text>
            </View>
            <View>
              <Text className="text-gray-500 text-sm mb-1">등록한 사용자 전화번호</Text>
              <Text className="text-base text-[#222]">{phone || '정보 없음'}</Text>
            </View>
          </View>

          {/* 서비스 요청 내역 */}
          <Text className="text-[18px] font-bold text-[#222] mb-3">서비스 요청 내역</Text>
          {requests.length === 0 ? (
            <Text className="text-gray-400">요청된 서비스가 없습니다.</Text>
          ) : (
            requests.map((req) => (
              <View key={req.id} className="border-b border-gray-200 py-3">
                <Text className="text-base font-medium text-[#222]">
                  {SERVICE_NAME_MAP[req.services.name] || req.services.name}
                </Text>
                <Text className="text-sm text-gray-500">{req.status} • {new Date(req.created_at).toLocaleString()}</Text>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <Text className="text-center text-gray-400 mt-8">가게 정보를 찾을 수 없습니다.</Text>
      )}
    </View>
  );
}
