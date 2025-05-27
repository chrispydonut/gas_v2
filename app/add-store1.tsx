import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

const KAKAO_REST_API_KEY = '96f486d6b8d281305787e1210c64ed4e';

export default function AddStore1() {
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. 카카오맵 장소 검색
  const searchPlaces = async () => {
    if (!keyword) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}`,
        {
          headers: {
            Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
          },
        }
      );
      const json = await res.json();
      setSearchResults(json.documents || []);
    } catch (e) {
      Alert.alert('검색 실패', '카카오 API 호출에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 2. 선택한 장소를 Supabase에 저장
  const handleSelectStore = async (place: any) => {
    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
      setLoading(false);
      Alert.alert('오류', '유저 정보를 불러올 수 없습니다.');
      return;
    }
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .insert({
        user_id: user.id,
        name: place.place_name,
        address: place.road_address_name || place.address_name,
      })
      .select()
      .single();

    if (storeError || !storeData) {
      setLoading(false);
      Alert.alert('오류', storeError?.message || '가게 추가에 실패했습니다.');
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ default_store_id: storeData.id })
      .eq('id', user.id);

    setLoading(false);
    if (profileError) {
      Alert.alert('오류', profileError.message || '프로필 업데이트 실패');
      return;
    }

    Alert.alert('완료', '가게가 성공적으로 추가되었습니다.', [
      { text: '확인', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  return (
    <View className="flex-1 bg-white">
      {/* 검색창 */}
      <View className="flex-1 justify-center px-6">
        <View className="flex-row items-center w-full">
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
            placeholder="가게명, 주소 등 검색"
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={searchPlaces}
            returnKeyType="search"
          />
          <TouchableOpacity
            className="ml-2 bg-[#FF5A36] px-5 py-3 rounded-lg"
            onPress={searchPlaces}
            disabled={loading}
          >
            <Text className="text-white font-bold text-base">검색</Text>
          </TouchableOpacity>
        </View>
        {loading && <ActivityIndicator className="mt-4" />}
      </View>

      {/* 검색 결과 리스트 */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="border-b border-gray-200 py-3 px-6 bg-white"
            onPress={() => handleSelectStore(item)}
          >
            <Text className="font-bold text-base">{item.place_name}</Text>
            <Text className="text-gray-700">{item.road_address_name || item.address_name}</Text>
            {!!item.phone && (
              <Text className="text-xs text-gray-400">{item.phone}</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={() =>
          !loading ? (
            <Text className="text-center text-gray-400 mt-8">
              검색 결과가 없습니다.
            </Text>
          ) : null
        }
        style={{ maxHeight: 350 }}
      />
    </View>
  );
}
