import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, Feather, Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Profile() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [phone, setPhone] = useState('010-9876-5432');
  const [store, setStore] = useState('');
  const router = useRouter();


  function formatPhoneNumber(phone: string) {
    if (phone.startsWith('+82')) {
      const withoutCountryCode = phone.replace('+82', '0');
      return withoutCountryCode.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    return phone;
  }

  
  useEffect(() => {
    const fetchProfileAndStore = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
  
      const { data: profile } = await supabase
        .from('profiles')
        .select('default_store_id, phone')
        .eq('id', user.id)
        .maybeSingle();
  
      if (profile?.phone) {
        const formattedPhone = formatPhoneNumber(profile.phone);
        setPhone(formattedPhone);
      }
  
      if (profile?.default_store_id) {
        const { data: store } = await supabase
          .from('stores')
          .select('name')
          .eq('id', profile.default_store_id)
          .maybeSingle();
        if (store) {
          setStore(store.name);
        }
      }
    };
  
    fetchProfileAndStore();
  }, []);
  

  // 로그아웃 (placeholder)
  const handleLogout = () => {
    supabase.auth.signOut();
    router.replace('/authentication/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        {/* 상단 헤더 */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-5 bg-white">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text className="text-[22px] font-bold text-[#222]">프로필</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* 프로필 정보 */}
        <View className="px-6 mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[#FF5A36] text-[18px] font-bold mb-1">
                {store ? `${store} 고객님` : '가게명을 불러오는 중...'}
              </Text>
              <View className="flex-row items-center mb-0.5">
                <Feather name="phone" size={15} color="#888" />
                <Text className="ml-1 text-[#888] text-[14px]">{phone}</Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-[#FF5A36] w-10 h-10 rounded-full items-center justify-center"
              onPress={() => setModalVisible(true)}
            >
              <FontAwesome5 name="pen" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>


        {/* 로그아웃 버튼 */}
        <View className="px-6 mb-4">
          <TouchableOpacity className="bg-[#FFF2EE] rounded-2xl py-3 items-center flex-row justify-center" onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#FF5A36" />
            <Text className="ml-2 text-[#FF5A36] text-[16px] font-bold">로그아웃</Text>
          </TouchableOpacity>
        </View>

        {/* 메뉴 리스트 */}
        <View className="px-6">
          <TouchableOpacity
            className="flex-row items-center justify-between py-3 border-b border-[#F3F3F3]"
            onPress={() => router.push('/profile/my-store')}
          >
            <View className="flex-row items-center">
              <Entypo name="location-pin" size={20} color="#222" />
              <Text className="ml-3 text-[16px] text-[#222]">나의 가게(위치)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#bbb" />
          </TouchableOpacity>
          <MenuItem icon={<Feather name="gift" size={20} color="#222" />} label="프로모션" />
          <MenuItem icon={<Feather name="credit-card" size={20} color="#222" />} label="결제 수단" onPress={() => router.push('/profile/payment')} />
          <MenuItem icon={<Feather name="help-circle" size={20} color="#222" />} label="고객센터" onPress={() => router.push('/service/center')} />
        </View>

        {/* 알림 받기 스위치 */}
        <View className="flex-row items-center justify-between px-6 mt-4">
          <Text className="text-[16px] text-[#222]">알림 받기</Text>
          <Switch
            value={isEnabled}
            onValueChange={setIsEnabled}
            trackColor={{ false: "#eee", true: "#FF5A36" }}
            thumbColor={isEnabled ? "#fff" : "#fff"}
          />
        </View>

        {/* 가게 정보 변경 모달 */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          {/* 어두운 배경 */}
          <Pressable
            className="flex-1 bg-black/30"
            onPress={() => setModalVisible(false)}
          >
            {/* 아래 모달 내용 */}
            <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl px-6 pt-3 pb-8">
              <View className="items-center mb-3">
                <View className="w-12 h-1.5 bg-gray-300 rounded-full mb-2" />
                <Text className="text-[17px] font-bold text-[#222] mb-4">가게 정보 변경</Text>
              </View>
              <View className="mb-3">
                <TextInput
                  className="bg-[#F6F6F6] rounded-xl px-4 py-3 mb-3 text-[16px]"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="전화번호"
                  keyboardType="phone-pad"
                />
                <View className="flex-row items-center bg-[#F6F6F6] rounded-xl px-4 py-3">
                  <Ionicons name="person-outline" size={18} color="#bbb" />
                  <TextInput
                    className="flex-1 ml-2 text-[16px]"
                    value={store}
                    onChangeText={setStore}
                    placeholder="가게명"
                  />
                </View>
              </View>
              <View className="flex-row justify-between mt-4">
                <TouchableOpacity className="bg-[#FF5A36] rounded-xl px-6 py-3" onPress={() => setModalVisible(false)}>
                  <Text className="text-white font-bold text-[16px]">저장</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-gray-300 rounded-xl px-6 py-3" onPress={() => setModalVisible(false)}>
                  <Text className="text-black font-bold text-[16px]">취소</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// 메뉴 아이템 컴포넌트
function MenuItem({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity className="flex-row items-center justify-between py-3 border-b border-[#F3F3F3]" onPress={onPress}>
      <View className="flex-row items-center">
        {icon}
        <Text className="ml-3 text-[16px] text-[#222]">{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#bbb" />
    </TouchableOpacity>
  );
}
