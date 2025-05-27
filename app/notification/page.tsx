import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import dayjs from 'dayjs';

// 🔸 알림 데이터 타입 정의
type Notification = {
  id: string;
  user_id: string;
  title: string;
  desc: string;
  icon_type: string;
  created_at: string;
};

// 🔸 알림 추가 함수
export async function addNotification(
  userId: string,
  title: string,
  desc: string,
  iconType: string
) {
  const { error } = await supabase.from('notifications').insert([
    {
      user_id: userId,
      title,
      desc,
      icon_type: iconType,
    },
  ]);

  if (error) {
    console.log('🔴 알림 추가 실패:', error.message);
  } else {
    console.log('✅ 알림 추가 성공');
  }
}

export default function NotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      console.log('👤 로그인 유저:', user?.id);
  
      if (!user) return;
  
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
  
      if (error) {
        console.log('❌ 알림 로딩 실패:', error.message);
      } else {
        console.log('✅ 알림 불러옴:', data.length);
        setNotifications(data);
      }
    };
  
    fetchNotifications();
  }, []);
  

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="pt-6 flex-1 bg-white">
        {/* 상단 헤더 */}
        <View className="pt-12 flex-row items-center justify-between px-5 pb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text className="text-[22px] font-bold text-[#222]">알림센터</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
          {notifications.map((item, idx) => (
            <View key={idx} className="flex-row items-center px-6 py-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: getIconBg(item.icon_type) }}
              >
                {renderIcon(item.icon_type)}
              </View>
              <View className="flex-1">
                <Text className="text-[16px] font-bold text-[#222]">{item.title}</Text>
                <Text className="text-[14px] text-[#555]">{item.desc}</Text>
              </View>
              <Text className="text-[13px] text-[#888] ml-2">
                {dayjs(item.created_at).format('YYYY/MM/DD')}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </>
  );
}

// 🔸 아이콘 렌더링 함수
function renderIcon(type: string) {
  switch (type) {
    case 'promotion':
      return <MaterialIcons name="local-offer" size={24} color="#FFC107" />;
    case 'payment':
      return <FontAwesome5 name="credit-card" size={22} color="#4DD0E1" />;
    case 'service':
      return <MaterialIcons name="miscellaneous-services" size={24} color="#4DD0A1" />;
    case 'cancel':
      return <Ionicons name="close-circle" size={24} color="#FF6B6B" />;
    case 'update':
      return <Ionicons name="person-circle-outline" size={24} color="#4DD0E1" />;
    case 'complete':
      return <Ionicons name="checkmark-circle" size={24} color="#4DD0A1" />;
    default:
      return <Ionicons name="notifications" size={24} color="#999" />;
  }
}

// 🔸 배경색 렌더링 함수
function getIconBg(type: string) {
  switch (type) {
    case 'promotion':
      return '#FFF7E0';
    case 'payment':
      return '#E0F7FA';
    case 'service':
      return '#E0F7EF';
    case 'cancel':
      return '#FFEAEA';
    case 'update':
      return '#E0F7FA';
    case 'complete':
      return '#E0F7EF';
    default:
      return '#F0F0F0';
  }
}
