import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, TouchableWithoutFeedback, Keyboard, TextInput, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { addNotification } from '../notification/page';
import { supabase } from '~/lib/supabase';

const ITEMS = [
  { id: 1, name: '8미리 밸브교체', price: 15000 },
  { id: 2, name: '공기조절기 교체', price: 15000 },
];

const IMAGES = [
  require('../../assets/valve/1.jpg'),
  require('../../assets/valve/air.png'),
];

export default function Pipe() {
  const router = useRouter();
  const [extra, setExtra] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [counts, setCounts] = useState(Array(ITEMS.length).fill(0));

  const activeColor = '#EB5A36';
  const inactiveColor = '#FFBDBD';

  const handleCount = (idx: number, diff: number) => {
    setCounts(prev =>
      prev.map((c, i) => (i === idx ? Math.max(0, c + diff) : c))
    );
  };

  const handleSubmit = async () => {
    if (extra === null) return;

    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('오류', '로그인 정보를 확인할 수 없습니다.');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('default_store_id')
      .eq('id', user.id)
      .single();

    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .eq('name', 'valve') // 실제 서비스 키값 확인
      .single();

    if (serviceError || !service?.id) {
      Alert.alert('에러', '서비스 정보를 불러오지 못했습니다.');
      setLoading(false);
      return;
    }

    const now = new Date().toISOString();

    const { data: request, error: requestError } = await supabase
      .from('service_requests')
      .insert({
        user_id: user.id,
        store_id: profile?.default_store_id || null,
        service_id: service.id,
        status: '요청됨',
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();

    if (requestError || !request) {
      Alert.alert('요청 실패', requestError?.message || '요청을 생성할 수 없습니다.');
      setLoading(false);
      return;
    }

    // const details = [
    //   {
    //     request_id: request.id,
    //     key: '추가 요청사항',
    //     value: extra,
    //   },
    // ];

    const details = ITEMS
      .map((item, idx) => {
        const count = counts[idx];
        if (count > 0) {
          return {
            request_id: request.id,
            key: item.name,
            value: `${count}개`,
          };
        }
        return null;
      })
      .filter(Boolean);

    // 추가 요청사항 추가
    if (extra !== '') {
      details.push({
        request_id: request.id,
        key: '추가 요청사항',
        value: extra,
      });
    }

    const { error: detailError } = await supabase
      .from('request_details')
      .insert(details);

    setLoading(false);

    if (detailError) {
      Alert.alert('저장 실패', detailError.message);
    } else {
      // 🔸 알림 추가
      await addNotification(
        user.id,
        '밸브 교체 신청 완료',
        `밸브 교체 신청이 완료되었습니다.`,
        'service'
      );

      setShowModal(true);
    }
  };  

  const total = counts.reduce((sum, c, i) => sum + c * ITEMS[i].price, 0);
  console.log(total);
  const anySelected = counts.some(c => c > 0);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        className="flex-1 bg-white pt-8"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 상단 헤더 */}
        <View className="pt-12 flex-row items-center justify-between px-5 mb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text className="text-[22px] font-bold text-[#222]">밸브 교체</Text>
          <TouchableOpacity onPress={() => router.push('/notification/page')}>
            <Ionicons name="notifications-outline" size={26} color="#222" />
          </TouchableOpacity>
        </View>

        
        
        <View className="px-4">
          {/* 아이템 리스트 */}
          <ScrollView className="px-0" contentContainerStyle={{ paddingBottom: 8 }}>
            {ITEMS.map((item, idx) => (
              <View
                key={item.id}
                className="flex-row items-center bg-white rounded-2xl border border-[#eee] px-4 py-3 mb-3"
              >
                {/* 이미지 자리 */}
                <View className="w-16 h-16 bg-[#F3F6FA] rounded-xl items-center justify-center mr-4">
                  <Image source={IMAGES[item.id - 1]} resizeMode="contain" className="w-full h-full" />
                </View>
                {/* 정보 */}
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-[#222] mb-2">{item.name}</Text>
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      className="w-7 h-7 rounded-full bg-[#FADCD2] items-center justify-center mr-2"
                      onPress={() => handleCount(idx, -1)}
                    >
                      <Text className="text-[#EB5A36] text-xl font-bold">-</Text>
                    </TouchableOpacity>
                    <Text className="text-[16px] font-bold text-[#222] w-6 text-center">{counts[idx]}</Text>
                    <TouchableOpacity
                      className="w-7 h-7 rounded-full bg-[#FADCD2] items-center justify-center ml-2"
                      onPress={() => handleCount(idx, 1)}
                    >
                      <Text className="text-[#EB5A36] text-xl font-bold">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {/* 가격 */}
                <Text className="text-[15px] font-bold text-[#222] ml-2">{item.price.toLocaleString()}원</Text>
              </View>
            ))}
          </ScrollView>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <TextInput
              className="w-full min-h-[56px] h-32 bg-[#F6F7FB] rounded-2xl px-4 py-4 text-[15px] text-[#888] mt-1"
              placeholder="추가 요청사항을 입력해주세요."
              placeholderTextColor="#bbb"
              value={extra}
              onChangeText={setExtra}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </TouchableWithoutFeedback>
        </View>        
        {/* 하단 버튼 */}
        <View className="absolute left-0 right-0 bottom-14 items-center">
          <View className="flex-row w-full justify-between items-center mb-5 px-7">
            <Text className="text-[#888] text-[15px]">전체</Text>
            <Text className="text-[18px] font-bold text-[#EB5A36]">{total.toLocaleString()} 원</Text>
          </View>
          <TouchableOpacity
            className={anySelected ? "bg-[#EB5A36] rounded-[28px] py-5 items-center w-[90%]" : "bg-[#FADCD2] rounded-[28px] py-5 items-center w-[90%]"}
            onPress={() => anySelected && handleSubmit()}
            disabled={!anySelected}
            activeOpacity={0.8}
          >
            <Text className="text-white text-[16px] font-bold">
              {loading ? '신청 중...' : '밸브 교체 신청'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 모달 */}
        <Modal visible={showModal} transparent animationType="fade">
          <View className="flex-1 bg-black/15 justify-center items-center">
            <View className="w-[85%] bg-white rounded-3xl items-center py-9 px-5 shadow shadow-black/10 elevation-8">
              <Ionicons name="checkmark-circle" size={56} color="#4CAF50" className="mb-3" />
              <Text className="text-[20px] font-bold text-[#222] mb-2">감사합니다.</Text>
              <Text className="text-[15px] text-[#888] mb-6 text-center">
                서비스가 성공적으로 접수되었습니다.
              </Text>
              <TouchableOpacity
                className="w-full bg-[#EB5A36] rounded-[28px] py-5 items-center"
                onPress={() => {
                  setShowModal(false);
                  router.replace('/(tabs)/my_service');
                }}
                activeOpacity={0.85}
              >
                <Text className="text-white font-bold text-[16px]">나의 서비스 확인하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </>
  );
}
