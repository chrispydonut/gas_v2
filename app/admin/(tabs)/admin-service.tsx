import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../lib/supabase';

const CATEGORIES = ['전체', '요청됨', '작업 시행 중', '서비스 완료', '서비스 취소됨'];

const STATUS_KOR_TO_ENG = {
  요청됨: '요청됨',
  '작업 시행 중': '진행중',
  '서비스 완료': '완료',
  '서비스 취소됨': '취소',
};

const STATUS_ICON = {
  요청됨: { icon: <Ionicons name="navigate-circle" size={28} color="#90CAF9" />, bg: '#E3F2FD' },
  진행중: { icon: <Ionicons name="pause-circle" size={28} color="#FFD36F" />, bg: '#FFF7E0' },
  완료: { icon: <Ionicons name="checkmark-circle" size={28} color="#4DD0A1" />, bg: '#E0F7EF' },
  취소: { icon: <Ionicons name="close-circle" size={28} color="#FF6B6B" />, bg: '#FFEAEA' },
};

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

export default function MyService() {
  const [selected, setSelected] = useState('전체');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        id,
        status,
        created_at,
        store:stores(name),
        service:services(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('서비스 요청 로드 실패:', error.message);
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [])
  );

  const filtered = requests.filter((r) => {
    if (selected === '전체') return true;
    return r.status === STATUS_KOR_TO_ENG[selected as keyof typeof STATUS_KOR_TO_ENG];
  });

  const grouped = filtered.reduce((acc, cur) => {
    const date = new Date(cur.created_at).toISOString().slice(0, 10);
    if (!acc[date]) acc[date] = [];
    acc[date].push(cur);
    return acc;
  }, {} as Record<string, typeof requests>);

  const getIcon = (name: string) => {
    if (name.includes('valve')) return require('../../../assets/valve.png');
    if (name.includes('gas')) return require('../../../assets/gas.png');
    if (name.includes('pipe')) return require('../../../assets/pipe.png');
    if (name.includes('burner')) return require('../../../assets/burner.png');
    if (name.includes('alarm')) return require('../../../assets/alarm.png');
    if (name.includes('quote')) return require('../../../assets/quote.png');
    return require('../../../assets/default.png');
  };

  return (
    <View className="flex-1 bg-white">
      <View className="pt-20 px-5 mb-3 items-center justify-center">
        <Text className="text-[22px] font-bold text-[#222]">서비스 관리</Text>
        <View className="w-[28px]" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        className="mb-2 mt-5 max-h-[40px]"
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            className={`rounded-2xl px-4 py-2 mr-2 h-[30px] ${selected === cat ? 'bg-[#FF5A36]' : 'bg-[#F3F3F3]'}`}
            onPress={() => setSelected(cat)}
          >
            <Text className={`text-[15px] font-medium ${selected === cat ? 'text-white' : 'text-[#222]'}`}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator className="mt-5" />
      ) : (
        <ScrollView className="flex-1">
          {Object.keys(grouped).map(date => (
            <View key={date}>
              <Text className="text-[#888] text-[14px] font-semibold px-6 mt-2 mb-2">{date}</Text>
              {grouped[date].map((service: any) => (
                <TouchableOpacity
                  key={service.id}
                  className="flex-row items-center px-6 py-3 bg-white"
                  onPress={() => router.push(`/admin/service-detail?id=${service.id}`)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={getIcon(service.service.name)}
                    className="w-[38px] h-[38px] mr-4"
                    resizeMode="contain"
                  />
                  <Text className="flex-1 text-[17px] font-bold text-[#222]">
                    {`${service.store.name} - ${SERVICE_NAME_MAP[service.service.name] || service.service.name}`}
                  </Text>
                  <View className="ml-2">
                    {STATUS_ICON[service.status as keyof typeof STATUS_ICON]?.icon}
                  </View>
                </TouchableOpacity>
              ))}
              <View className="h-px bg-[#eee] mx-4 my-1" />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}