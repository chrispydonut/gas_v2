import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import KakaoMapView from '../components/KakaoMapView';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import debounce from 'lodash/debounce';

const KAKAO_REST_API_KEY = '96f486d6b8d281305787e1210c64ed4e';

export default function AddStore2() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const router = useRouter();

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`, {
        headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
      });
      const json = await res.json();
      const addressName =
        json.documents?.[0]?.road_address?.address_name || json.documents?.[0]?.address?.address_name;
      if (addressName) setAddress(addressName);
    } catch (e) {
      console.warn('역지오코딩 실패:', e);
    }
  };

  const debouncedSearch = useCallback(
    debounce(async (keyword: string) => {
      if (!keyword) return;
      setLoading(true);
      try {
        const res = await fetch(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}`,
          {
            headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
          }
        );
        const json = await res.json();
        const results = json.documents || [];

        if (results.length === 0) {
          const addrRes = await fetch(
            `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(keyword)}`,
            {
              headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
            }
          );
          const addrJson = await addrRes.json();
          const first = addrJson.documents?.[0];
          if (first) {
            const lat = parseFloat(first.y);
            const lng = parseFloat(first.x);
            setMarker({ lat, lng });
            setAddress(first.address?.address_name || keyword);

            // ✅ 가짜 결과로 리스트 유지
            setSearchResults([
              {
                id: 'address_result',
                place_name: first.address?.address_name || keyword,
                road_address_name: '',
                address_name: first.address?.address_name || keyword,
                phone: '',
                x: first.x,
                y: first.y,
              },
            ]);
          } else {
            setSearchResults([]);
          }
        } else {
          setSearchResults(results);
        }
      } catch (e) {
        console.warn('검색 실패:', e);
      }
      setLoading(false);
    }, 400),
    []
  );

  const handleAddressChange = (text: string) => {
    // ✅ 이미 선택한 가짜 주소 결과일 경우 검색 안 함
    if (text === address && searchResults.length === 1 && searchResults[0].id === 'address_result') return;
    setAddress(text);
    debouncedSearch(text);
  };

  const handleSelectStore = (item: any) => {
    const fullAddress = item.road_address_name || item.address_name;
    setName(item.place_name);
    setAddress(fullAddress);
    setMarker({ lat: parseFloat(item.y), lng: parseFloat(item.x) });

    // ✅ 선택 후에도 리스트 유지
    setSearchResults([
      {
        ...item,
        id: 'address_result',
      },
    ]);
  };

  const saveStore = async () => {
    console.log("saveStore", name, address);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user.id;

    console.log("userId", userId);
    // const { error } = await supabase.from('stores').insert([
    //   {
    //     user_id: userId,
    //     name,
    //     address,
    //   },
    // ]);
    const { data, error } = await supabase.from('stores').insert({
      user_id: userId,
      name,
      address,
    }).select().single();

    console.log("data", data);
    console.log("error", error);
    if (error) {
      Alert.alert("error", error?.message);
    }

    if (!error) {
      router.replace('/profile/my-store');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <SafeAreaView className="flex-1 bg-white">
        {/* 상단 헤더 */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2 bg-white">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text className="text-[22px] font-bold text-[#222]">나의 가게</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* 지도 */}
        <KakaoMapView
          onMapTouch={(lat, lng) => {
            setMarker({ lat, lng });
            reverseGeocode(lat, lng);
          }}
          marker={marker ?? undefined}
        />

        {/* 위치 정보 입력 영역 */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-white px-6 pt-6 pb-0 rounded-t-2xl shadow-lg"
          style={{ minHeight: 360 }}
        >
          <Text className="font-bold text-base text-[18px] mb-2 text-center text-[#222]">위치 정보</Text>

          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-2 text-base"
            placeholder="가게 위치 (주소 검색)"
            value={address}
            onChangeText={handleAddressChange}
          />

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
            style={{ maxHeight: 160 }}
          />

          {loading && <ActivityIndicator className="mb-2" />}
        </View>

        {/* 저장 버튼 고정 */}
        <View className="absolute bottom-0 left-0 right-0 px-6 pb-9 pt-3 bg-white border-t border-gray-200">
          <TouchableOpacity
            className={`rounded-full py-4 items-center ${name.trim() && address.trim() ? 'bg-[#FF5A36]' : 'bg-[#FADCD2]'}`}
            onPress={name.trim() && address.trim() ? saveStore : undefined}
            activeOpacity={name.trim() && address.trim() ? 0.8 : 1}
          >
            <Text className="text-white font-bold text-base">저장</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
