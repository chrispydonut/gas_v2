import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

export default function Pipe() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white pt-8">
        {/* 상단 헤더 */}
        <View className="pt-12 flex-row items-center justify-between px-5 mb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text className="text-[22px] font-bold text-[#222]">정기계약 이용권</Text>
          <Ionicons name="notifications-outline" size={26} color="#222" />
        </View>
        <Text className="text-[16px] text-[#888] text-center mt-52">서비스 준비 중입니다.</Text>
      </View>
    </>
  );
}
