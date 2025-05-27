import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

export default function AdminStore() {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // 데이터 로딩
  useEffect(() => {
    const fetchStores = async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('가게 불러오기 실패:', error.message);
      } else {
        setStores(data || []);
        setFiltered(data || []);
      }
      setLoading(false);
    };

    fetchStores();
  }, []);

  // 검색 필터
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(stores);
    } else {
      const keyword = search.trim().toLowerCase();
      const result = stores.filter(store =>
        store.name?.toLowerCase().includes(keyword)
      );
      setFiltered(result);
    }
  }, [search, stores]);

  return (
    <View className="flex-1 bg-white pt-6">
      {/* 상단 헤더 */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-4 bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text className="text-[22px] font-bold text-[#222]">가게</Text>
        <View className="w-[28px]" />
      </View>

      {/* 검색창 */}
      <View className="px-5 mb-3">
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          placeholder="가게 이름 검색"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* 리스트 */}
      {loading ? (
        <ActivityIndicator className="mt-6" />
      ) : (
        <ScrollView className="flex-1 px-5">
          {filtered.map((store) => (
            <TouchableOpacity
              key={store.id}
              onPress={() => router.push(`/admin/${store.id}`)} // ✅ 상세 화면으로 이동
              className="border-b border-gray-200 py-4"
            >
              <Text className="text-[17px] font-semibold text-[#222]">{store.name}</Text>
              <Text className="text-sm text-gray-500">{store.address}</Text>
            </TouchableOpacity>
          ))}

          {filtered.length === 0 && (
            <Text className="text-center text-gray-400 mt-8">검색 결과가 없습니다.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}
