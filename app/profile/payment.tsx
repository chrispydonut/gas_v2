import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Modal } from 'react-native';
import { Ionicons, FontAwesome, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

const PAYMENT_METHODS = [
  { id: 'cash', label: '현금', icon: <MaterialIcons name="attach-money" size={24} color="#4CAF50" /> },
  // { id: 'apple', label: 'Apple Pay', icon: <FontAwesome name="apple" size={24} color="#000" /> },
  { id: 'card1', label: '계좌이체', icon: <FontAwesome name="cc-jcb" size={24} color="#1976D2" /> },
  { id: 'card2', label: '카드', icon: <FontAwesome5 name="cc-mastercard" size={24} color="#EB5A36" /> },
];

export default function PaymentScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white mb-4">
        {/* 상단 헤더 */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text className="text-[22px] font-bold text-[#222]">결제</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={26} color="#222" />
          </TouchableOpacity>
        </View>

        {/* 결제수단 리스트 */}
        <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 24, paddingTop: 12 }}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              className="flex-row items-center bg-white rounded-2xl border border-[#eee] px-4 py-4 mb-3 justify-between"
              onPress={() => setSelected(method.id)}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                {method.icon}
                <Text className="ml-3 text-[16px] font-bold text-[#222]">{method.label}</Text>
              </View>
              <View
                className={`w-6 h-6 rounded-full border-2 ${selected === method.id ? 'border-[#EB5A36]' : 'border-[#ccc]'} items-center justify-center`}
              >
                {selected === method.id && (
                  <View className="w-3.5 h-3.5 rounded-full bg-[#EB5A36]" />
                )}
              </View>
            </TouchableOpacity>
          ))}

          {/* Add New Card */}
          <TouchableOpacity className="bg-[#FFF2EE] rounded-2xl py-4 items-center flex-row justify-center mt-2">
            <Text className="text-[#EB5A36] text-[20px] font-bold mr-2">+</Text>
            <Text className="text-[#EB5A36] text-[16px] font-bold">Add New Card</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 하단 결제 버튼 */}
        <View className="px-5 pb-6">
          <TouchableOpacity
            className={`${selected ? 'bg-[#EB5A36]' : 'bg-[#FADCD2]'} rounded-[28px] py-5 items-center`}
            disabled={!selected}
            onPress={() => setShowModal(true)}
          >
            <Text className="text-white text-[16px] font-bold">결제</Text>
          </TouchableOpacity>
        </View>

        {/* 결제 성공 모달 */}
        <Modal visible={showModal} transparent animationType="fade">
          <View className="flex-1 bg-black/30 justify-center items-center">
            <View className="bg-white rounded-3xl px-7 py-8 items-center w-11/12">
              <View className="w-16 h-16 rounded-full bg-[#E6F4EA] items-center justify-center mb-4">
                <Ionicons name="checkmark-circle" size={56} color="#2CB742" />
              </View>
              <Text className="text-[20px] font-bold text-[#222] mb-2">감사합니다.</Text>
              <Text className="text-[#888] text-[15px] mb-6 text-center">
                서비스가 성공적으로 접수되었습니다.
              </Text>
              <TouchableOpacity
                className="bg-[#EB5A36] rounded-[28px] py-5 px-8 items-center w-full"
                onPress={() => {
                   setShowModal(false);
               router.push('/(tabs)/my_service');
             }}
            >
  <Text className="text-white text-[16px] font-bold">나의 서비스 확인하기</Text>
</TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}
