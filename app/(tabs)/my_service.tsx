

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

const CATEGORIES = ['전체', '화구 교체', '경보기 교체', '배관 철거', '가스누출 검사', '밸브 교체'];

const STATUS_ICON = {
  '요청됨': { icon: <Ionicons name="navigate-circle" size={28} color="#90CAF9" />, bg: '#E3F2FD' },
  '진행중': { icon: <Ionicons name="pause-circle" size={28} color="#FFD36F" />, bg: '#FFF7E0' },
  '완료': { icon: <Ionicons name="checkmark-circle" size={28} color="#4DD0A1" />, bg: '#E0F7EF' },
  '취소': { icon: <Ionicons name="close-circle" size={28} color="#FF6B6B" />, bg: '#FFEAEA' },
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

  useEffect(() => {
    const loadRequests = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('service_requests')
        .select(`id, status, created_at, services(name)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('요청 불러오기 실패:', error.message);
      } else {
        setRequests(data || []);
        console.log(data);
      }
      setLoading(false);
    };

    loadRequests();
  }, []);

  const filtered = requests.filter(r => {
    const koreanName = SERVICE_NAME_MAP[r.services.name];
    if (selected === '전체') return true;
    return koreanName?.includes(selected);
  });
  

  const grouped = filtered.reduce((acc, cur) => {
    const date = new Date(cur.created_at).toISOString().slice(0, 10);
    if (!acc[date]) acc[date] = [];
    acc[date].push(cur);
    return acc;
  }, {} as Record<string, typeof requests>);

  const getIcon = (name: string) => {
    if (name.includes('valve')) return require('../../assets/valve.png');
    if (name.includes('gas')) return require('../../assets/gas.png');
    if (name.includes('pipe')) return require('../../assets/pipe.png');
    if (name.includes('burner')) return require('../../assets/burner.png');
    if (name.includes('alarm')) return require('../../assets/alarm.png');
    if (name.includes('quote')) return require('../../assets/quote.png');
    return require('../../assets/default.png');
  };

  return (
    <View className="bg-white flex-1">
      {/* 상단 헤더 */}
      <View className="pt-20 flex-row items-center justify-between px-5 mb-3">
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text className="text-[22px] font-bold text-[#222]">나의 서비스</Text>
        <View className="w-[28px]" />
      </View>

      {/* 카테고리 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        className='mb-2 mt-5 max-h-[40px]'
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            className={`rounded-2xl px-4 py-2 mr-2 h-[30px] ${selected === cat ? 'bg-[#FF5A36]' : 'bg-[#F3F3F3]'}`}
            onPress={() => setSelected(cat)}
          >
            <Text className={`text-[15px] font-medium ${selected === cat ? 'text-white' : 'text-[#222]'}`}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 서비스 리스트 */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <ScrollView className='flex-1'>
          {Object.keys(grouped).map(date => (
            <View key={date}>
              <Text className="text-[#888] text-[14px] font-semibold px-6 mb-2 mt-2">{date}</Text>
              {grouped[date].map((service: any) => (
                <TouchableOpacity
                  key={service.id}
                  className="flex-row items-center px-6 py-3 bg-white"
                  onPress={() => router.push(`/my_service/service-detail?id=${service.id}`)}
                  activeOpacity={0.8}
                >
                  <Image source={getIcon(service.services.name)} style={{ width: 38, height: 38, marginRight: 16 }} resizeMode="contain" />
                  <Text className="flex-1 text-[17px] font-bold text-[#222]">
                    {SERVICE_NAME_MAP[service.services.name] || service.services.name}
                  </Text>
                  <View style={{ marginLeft: 8 }}>
                    {STATUS_ICON[service.status as keyof typeof STATUS_ICON]?.icon}
                  </View>
                </TouchableOpacity>
              ))}
              <View style={{ height: 1, backgroundColor: '#eee', marginHorizontal: 16, marginVertical: 4 }} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
