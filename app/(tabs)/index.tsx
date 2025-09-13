import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SERVICES = [
  { key: 'burner', label: '화구교체', icon: require('../../assets/burner.png') },
  { key: 'valve', label: '밸브 교체\n(공기 조절기)', icon: require('../../assets/valve.png') },
  { key: 'alarm', label: '경보기 교체', icon: require('../../assets/alarm.png') },
  { key: 'quote', label: '시공견적 문의', icon: require('../../assets/quote.png') },
  { key: 'pipe', label: '배관 철거', icon: require('../../assets/pipe.png') },
  { key: 'gas', label: '가스누출 검사', icon: require('../../assets/gas.png') },
  { key: 'contract', label: '정기계약 이용권', icon: require('../../assets/contract.png') },
  { key: 'center', label: '고객센터', icon: require('../../assets/center.png') },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const filtered = SERVICES.filter(s =>
    s.label.replace(/\s/g, '').includes(search.replace(/\s/g, ''))
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 상단 로고/알림 */}
      <View className="pt-4 mb-4 px-6 flex-row items-center justify-between">
        <View style={{ width: 40 }} />
        {/* <Text className="text-[26px] font-bold text-[#222] text-center flex-1">Logo3</Text> */}
        <Image source={require('../../assets/logo2.png')} className="w-[100px] h-[57px]" />
        <TouchableOpacity className="p-1" onPress={() => router.push('/notification/page')}>
          <Ionicons name="notifications-outline" size={28} color="#222" />
        </TouchableOpacity>
      </View>

      {/* 검색창 */}
      <View className="flex-row items-center bg-[#f6f6f6] rounded-2xl h-11 mb-6 mx-5 shadow shadow-black/10 elevation-2">
        <View className="ml-2">
          <Ionicons name="search" size={20} color="#aaa" />
        </View>
        <TextInput
          className="flex-1 text-[16px] ml-2 text-[#222]"
          placeholder="어떤 서비스를 찾으시나요?"
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <View className="mr-2">
              <Ionicons name="close" size={22} color="#aaa" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* 카드 그리드 or 검색 결과 */}
      <View className="mt-3 items-center flex-1">
        {search.length === 0 ? (
          // 전체 카드 그리드
          <View>
            {[0, 1, 2].map(i => (
              <View key={i} className="flex-row justify-center mb-5">
                {SERVICES.slice(i * 3, i * 3 + 3).map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    className="w-[104px] h-[104px] bg-white rounded-2xl items-center justify-center mx-3 shadow shadow-black/10 elevation-3"
                    onPress={() => router.push(item.key === 'center' ? '/contact' : `/service/${item.key}` as any)}
                  >
                    <Image source={item.icon} className="w-12 h-12 mb-2" resizeMode="contain" />
                    <Text className="text-[15px] text-[#222] font-medium text-center" style={{ lineHeight: 18 }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                {SERVICES.slice(i * 3, i * 3 + 3).length < 3 &&
                  Array(3 - SERVICES.slice(i * 3, i * 3 + 3).length).fill(null).map((_, k) => (
                    <View
                      key={`empty-${k}`}
                      className="w-[104px] h-[104px] rounded-2xl bg-transparent shadow-none mx-3"
                    />
                  ))}
              </View>
            ))}
          </View>
        ) : filtered.length === 0 ? (
          // 검색 결과 없음
          <View className="flex-1 items-center justify-center">
            <Text className="text-[#888] text-[16px] mt-10">결과가 없습니다.</Text>
          </View>
        ) : (
          // 검색 결과 카드
          <View className="w-full flex-row flex-wrap justify-start px-5">
            {filtered.map(item => (
              <TouchableOpacity
                key={item.key}
                className="w-[104px] h-[104px] bg-white rounded-2xl items-center justify-center mx-0 mb-5 shadow shadow-black/10 elevation-3 mr-4"
                onPress={() => router.push(item.key === 'center' ? '/contact' : `/service/${item.key}` as any)}
                style={{ marginLeft: 0, marginRight: 16 }}
              >
                <Image source={item.icon} className="w-16 h-16 mb-2" resizeMode="contain" />
                <Text className="text-[15px] text-[#222] font-medium text-center" style={{ lineHeight: 18 }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
