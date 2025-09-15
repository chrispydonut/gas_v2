import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { toInternational } from '../../lib/toInternational';

// 관리자는 이메일/비밀번호로 로그인!
const ADMIN_EMAIL = 'GAS@gas.com'; // 실제 이메일 주소로 변경!

export default function Login() {
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdminFlow, setIsAdminFlow] = useState(false);

  const router = useRouter();

  // 입력값이 바뀔 때마다 state 초기화
  const handleInputChange = (text: string) => {
    setPhoneOrEmail(text);
    setIsAdminFlow(false);
    setOtpSent(false);
    setCode('');
    setPassword('');
  };

  // "인증번호 보내기" or "비밀번호 입력" 분기
  const handleSendOtpOrPassword = async () => {
    if (!phoneOrEmail) {
      Alert.alert('입력 오류', '전화번호를 입력하세요.');
      return;
    }

    if (phoneOrEmail.includes('@')) {
      // 이메일이면 관리자 로그인 플로우
      setIsAdminFlow(true);
      setOtpSent(true); // 비밀번호 입력창 띄움
      return;
    }

    // 일반 유저: 휴대폰 로그인
    const internationalPhone = toInternational(phoneOrEmail);

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: internationalPhone });
    setLoading(false);
    if (error) {
      Alert.alert('전송 실패', error.message);
    } else {
      setOtpSent(true);
      Alert.alert('인증번호가 전송되었습니다.');
    }
  };

  // "확인" 클릭시
  const handleLogin = async () => {
    if (isAdminFlow) {
      // 관리자: 이메일+비번 로그인
      if (!password) {
        Alert.alert('입력 오류', '비밀번호를 입력하세요.');
        return;
      }
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: phoneOrEmail,
        password,
      });
      setLoading(false);

      if (error) {
        Alert.alert('로그인 실패', error.message);
        return;
      }

      // 프로필 role 검사
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        Alert.alert('에러', '프로필 정보 조회 실패: ' + profileError.message);
        return;
      }
      if (profile?.role === 'admin') {
        router.replace('/admin/admin-service');
      } else {
        Alert.alert('권한 없음', '관리자 권한이 없는 계정입니다.');
      }
      return;
    }

    // 일반 유저: OTP 인증
    const internationalPhone = toInternational(phoneOrEmail);
    if (!code) {
      Alert.alert('입력 오류', '인증번호를 입력하세요.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: internationalPhone,
      token: code,
      type: 'sms',
    });
    setLoading(false);

    if (error) {
      Alert.alert('로그인 실패', error.message);
      return;
    }

    // 세션에서 내 id/phone 가져오기
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;
    if (!userId) {
      Alert.alert('에러', '유저 정보를 불러올 수 없습니다.');
      return;
    }

    // profiles에서 role 체크
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError) {
      Alert.alert('에러', '프로필 정보 조회 실패: ' + profileError.message);
      return;
    }
    if (profile?.role === 'admin') {
      router.replace('/admin/admin-service');
      return;
    }

    // 유저: 가게 정보 체크 후 라우팅
    const { data: stores, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', userId);

    if (storeError) {
      Alert.alert('에러', '가게 정보 조회 실패: ' + storeError.message);
      return;
    }
    if (!stores || stores.length === 0) {
      router.replace('/add-store1');
    } else {
      router.replace('/');
    }
  };

  const handleSignup = () => {
    router.push('/authentication/signup');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, marginTop: -112 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* <Text className="text-3xl font-bold mb-8 text-center">로그인</Text> */}
        <View className="flex-row items-center justify-center mb-20">
          <Image source={require('../../assets/logo.png')} className="w-[172.8px] h-[104.6px]" />
        </View>

      {/* 전화번호/이메일 입력창 */}
      <TextInput
        className="border border-gray-300 rounded-lg px-4 mb-2 text-base"
        style={{ height: 44, paddingVertical: 8, lineHeight: 20 }}
        placeholder="전화번호 (예: 01012345678)"
        placeholderTextColor="#999"
        value={phoneOrEmail}
        onChangeText={handleInputChange}
        // keyboardType={isAdminFlow ? "default" : "phone-pad"}
        keyboardType="default"
        editable={!loading}
        autoCapitalize="none"
      />

      {/* 입력창(OTP/비밀번호) 분기 */}
      {otpSent && (
        isAdminFlow ? (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 mb-6 text-base"
            style={{ height: 44, paddingVertical: 8, lineHeight: 20 }}
            placeholder="비밀번호를 입력하세요."
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        ) : (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 mb-6 text-base"
            style={{ height: 44, paddingVertical: 8, lineHeight: 20 }}
            placeholder="인증번호 입력"
            placeholderTextColor="#999"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
        )
      )}

      {loading && <ActivityIndicator style={{ marginBottom: 16 }} />}

      {/* 버튼 이름은 항상 동일 */}
      {!otpSent ? (
        <TouchableOpacity
          onPress={handleSendOtpOrPassword}
          className="bg-[#EB5A36] rounded-lg py-3 mb-4"
          disabled={loading}
        >
          <Text className="text-white text-center font-medium text-base">인증번호 보내기</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handleLogin}
          className="bg-[#EB5A36] rounded-lg py-3 mb-4"
          disabled={loading}
        >
          <Text className="text-white text-center font-medium text-base">확인</Text>
        </TouchableOpacity>
      )}

      {/* 구분선 */}
      <View className="flex-row items-center my-4">
        <View className="flex-1 h-px bg-gray-300" />
        <Text className="px-2 text-gray-500">또는</Text>
        <View className="flex-1 h-px bg-gray-300" />
      </View>

        {/* 회원가입 버튼 */}
        <TouchableOpacity onPress={handleSignup} className="py-2">
          <Text className="text-center text-[#222] font-medium">회원가입</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
