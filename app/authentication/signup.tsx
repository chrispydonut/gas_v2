import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { toInternational } from '../../lib/toInternational';

export default function Signup() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // 전화번호 유효성 검사
  const validatePhone = (phoneNumber: string) => {
    // 숫자만 추출
    const numbersOnly = phoneNumber.replace(/[^0-9]/g, '');
    // 한국 휴대폰 번호 형식 검사 (010, 011, 016, 017, 018, 019)
    if (!/^01[016789]/.test(numbersOnly)) {
      return false;
    }
    // 길이 검사 (하이픈 제외 11자리)
    if (numbersOnly.length !== 11) {
      return false;
    }
    return true;
  };

  // 인증번호 요청
  const handleSendOtp = async () => {
    if (!phone) {
      Alert.alert('입력 오류', '전화번호를 입력하세요.');
      return;
    }
    if (!validatePhone(phone)) {
      Alert.alert('입력 오류', '올바른 휴대폰 번호를 입력하세요.\n예: 01012345678');
      return;
    }

    const internationalPhone = toInternational(phone);
    setLoading(true);

    try {
      // 1. 이미 가입된 전화번호인지 profiles에서 조회
      const { data: existUsers, error: existError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', internationalPhone);

      if (existError) {
        throw existError;
      }

      if (existUsers && existUsers.length > 0) {
        Alert.alert('중복 가입', '이미 가입된 전화번호입니다.');
        setLoading(false);
        return;
      }

      // 2. 미가입일 경우에만 인증번호 요청
      console.log('Sending OTP to:', internationalPhone);
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: internationalPhone,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error('Supabase OTP Error:', error);
        Alert.alert('전송 실패', error.message || '인증번호 전송에 실패했습니다.');
      } else {
        console.log('OTP sent successfully:', data);
        setOtpSent(true);
        Alert.alert('인증번호가 전송되었습니다.');
      }
    } catch (err) {
      console.error('Network/Error:', err);
      Alert.alert('오류 발생', '인증번호 전송 중 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 인증번호로 회원가입
  const handleSignup = async () => {
    if (!phone || !code) {
      Alert.alert('입력 오류', '전화번호와 인증번호를 모두 입력하세요.');
      return;
    }
    const internationalPhone = toInternational(phone);
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: internationalPhone,
      token: code,
      type: 'sms',
    });
    setLoading(false);
    if (error) {
      Alert.alert('인증 실패', error.message);
    } else {
      // 유저 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        Alert.alert('오류', '유저 정보를 불러올 수 없습니다.');
        return;
      }
      // 유저 정보를 profiles 테이블에 저장
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          phone: internationalPhone,
        });
      Alert.alert(
        '회원가입 성공',
        '회원가입이 완료되었습니다.\n가게 추가 화면으로 이동합니다.',
        [{ text: '확인', onPress: () => router.replace('/add-store1') }],
        { cancelable: false }
      );
    }
  };

  // 로그인 화면으로 돌아가기
  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      {/* 상단 뒤로가기 */}
      <View className="absolute top-14 left-4 z-10">
        <TouchableOpacity onPress={handleBack} className="flex-row items-center">
          <Text className="text-black">&lt; 로그인 화면으로</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold mb-8 text-center">회원가입</Text>

        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
          placeholder="전화번호 (예: 01012345678 또는 +821012345678)"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!otpSent}
        />

        {otpSent && (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
            placeholder="인증번호 입력"
            placeholderTextColor="#999"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
        )}

        {loading && <ActivityIndicator style={{ marginBottom: 16 }} />}

        {!otpSent ? (
          <TouchableOpacity
            onPress={handleSendOtp}
            className="bg-[#EB5A36] rounded-lg py-3"
            disabled={loading}
          >
            <Text className="text-white text-center font-medium text-base">인증번호 보내기</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSignup}
            className="bg-[#EB5A36] rounded-lg py-3"
            disabled={loading}
          >
            <Text className="text-white text-center font-medium text-base">확인</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
