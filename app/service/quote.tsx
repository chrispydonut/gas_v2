import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '~/lib/supabase';
import { addNotification } from '../notification/page'; // ✅ 알림 함수 import (경로 맞게 수정)

const OPTIONS = [
  'LPG',
  'LNG',
];

export default function AlarmReplace() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [extra, setExtra] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const activeColor = '#EB5A36';
  const inactiveColor = '#FFBDBD';

  const handleSubmit = async () => {
    if (selected === null) return;

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
      .eq('name', 'quote') // '시공견적' 서비스 이름
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

    const details = [
      {
        request_id: request.id,
        key: '시공 종류',
        value: OPTIONS[selected],
      },
    ];

    if (extra.trim()) {
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
      // ✅ 알림 추가
      await addNotification(
        user.id,
        '시공 견적 요청 완료',
        `${OPTIONS[selected]} 신청이 완료되었습니다.`,
        'service'
      );

      setShowModal(true); // 요청 완료 모달
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white pt-8">
        {/* 상단 헤더 */}
        <View className="pt-12 flex-row items-center justify-between px-5 mb-5">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text className="text-[22px] font-bold text-[#222]">시공견적 문의</Text>
          <TouchableOpacity onPress={() => router.push('/notification/page')}>
            <Ionicons name="notifications-outline" size={26} color="#222" />
          </TouchableOpacity>
        </View>

        {/* 선택 옵션 */}
        <View className="px-4">
          {OPTIONS.map((opt, idx) => {
            const isActive = selected === idx;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => setSelected(idx)}
                className={`flex-row items-center rounded-2xl px-4 py-5 mb-4 border ${isActive ? 'border-[#EB5A36]' : 'border-[#eee]'}`}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isActive ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={isActive ? '#EB5A36' : '#bbb'}
                  style={{ marginRight: 12 }}
                />
                <Text className="text-[17px] text-[#222]">{opt}</Text>
              </TouchableOpacity>
            );
          })}

          {/* 추가 요청사항 */}
          <TextInput
            className="w-full min-h-[56px] h-32 bg-[#F6F7FB] rounded-2xl px-4 py-4 text-[15px] text-[#888] mt-1"
            placeholder="추가 요청사항을 입력해주세요.."
            placeholderTextColor="#bbb"
            value={extra}
            onChangeText={setExtra}
            multiline
          />
        </View>

        {/* 하단 버튼 */}
        <View className="absolute left-0 right-0 bottom-14 items-center">
          <TouchableOpacity
            className="w-[90%] rounded-[28px] py-5 items-center"
            style={{ backgroundColor: selected !== null ? activeColor : inactiveColor }}
            activeOpacity={0.8}
            onPress={handleSubmit}
          >
            <Text className="text-white text-[16px] font-bold">
              {loading ? '신청 중...' : '시공견적 문의'}
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
      </View>
    </>
  );
}
