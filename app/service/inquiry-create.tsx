import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface Store {
  id: string;
  name: string;
}

export default function InquiryCreate() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('일반문의');
  const [priority, setPriority] = useState('보통');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const categories = ['일반문의', '기술지원', '서비스문의', '기타'];
  const priorities = ['낮음', '보통', '높음'];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.id) return;

    // 프로필 정보 가져오기
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    setProfile(profileData);

    // 사용자의 매장 목록 가져오기
    const { data: storesData } = await supabase
      .from('stores')
      .select('id, name')
      .eq('user_id', userData.user.id);

    setStores(storesData || []);

    // 기본 매장 설정
    if (profileData?.default_store_id) {
      setSelectedStore(profileData.default_store_id);
    } else if (storesData && storesData.length > 0) {
      setSelectedStore(storesData[0].id);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('알림', '제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('알림', '문의 내용을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const { data, error } = await supabase
        .from('inquiries')
        .insert({
          user_id: userData.user.id,
          store_id: selectedStore,
          title: title.trim(),
          content: content.trim(),
          category,
          priority,
        })
        .select()
        .single();

      if (error) {
        console.error('문의글 작성 실패:', error);
        Alert.alert('오류', '문의글 작성에 실패했습니다.');
        return;
      }

      Alert.alert(
        '완료',
        '문의글이 성공적으로 등록되었습니다.',
        [
          {
            text: '확인',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('문의글 작성 중 오류:', error);
      Alert.alert('오류', '문의글 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const CategorySelector = () => (
    <View className="mb-6">
      <Text className="text-[16px] font-medium text-[#222] mb-3">카테고리</Text>
      <View className="flex-row flex-wrap">
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategory(cat)}
            className={`mr-3 mb-2 px-4 py-2 rounded-full border ${
              category === cat
                ? 'bg-[#EB5A36] border-[#EB5A36]'
                : 'bg-white border-[#ddd]'
            }`}
          >
            <Text
              className={`text-[14px] ${
                category === cat ? 'text-white font-medium' : 'text-[#666]'
              }`}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const PrioritySelector = () => (
    <View className="mb-6">
      <Text className="text-[16px] font-medium text-[#222] mb-3">우선순위</Text>
      <View className="flex-row">
        {priorities.map((pri) => (
          <TouchableOpacity
            key={pri}
            onPress={() => setPriority(pri)}
            className={`mr-3 px-4 py-2 rounded-full border ${
              priority === pri
                ? 'bg-[#EB5A36] border-[#EB5A36]'
                : 'bg-white border-[#ddd]'
            }`}
          >
            <Text
              className={`text-[14px] ${
                priority === pri ? 'text-white font-medium' : 'text-[#666]'
              }`}
            >
              {pri}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const StoreSelector = () => (
    <View className="mb-6">
      <Text className="text-[16px] font-medium text-[#222] mb-3">매장 선택</Text>
      {stores.length > 0 ? (
        <View>
          {stores.map((store) => (
            <TouchableOpacity
              key={store.id}
              onPress={() => setSelectedStore(store.id)}
              className={`flex-row items-center p-3 mb-2 rounded-lg border ${
                selectedStore === store.id
                  ? 'bg-[#EB5A36] border-[#EB5A36]'
                  : 'bg-white border-[#ddd]'
              }`}
            >
              <Ionicons
                name={selectedStore === store.id ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedStore === store.id ? 'white' : '#666'}
              />
              <Text
                className={`ml-3 text-[14px] ${
                  selectedStore === store.id ? 'text-white font-medium' : 'text-[#666]'
                }`}
              >
                {store.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text className="text-[#888] text-[14px]">등록된 매장이 없습니다.</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* 헤더 */}
      <View className="pt-4 flex-row items-center justify-between px-5 pb-4 border-b border-[#eee]">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-[#222]">문의 작성</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !title.trim() || !content.trim()}
          className={`px-4 py-2 rounded-full ${
            loading || !title.trim() || !content.trim()
              ? 'bg-[#ccc]'
              : 'bg-[#EB5A36]'
          }`}
        >
          <Text className="text-white font-medium text-[14px]">
            {loading ? '등록중...' : '등록'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
          {/* 제목 입력 */}
          <View className="mb-6">
            <Text className="text-[16px] font-medium text-[#222] mb-3">제목</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="문의 제목을 입력해주세요"
              className="border border-[#ddd] rounded-lg px-4 py-3 text-[16px] text-[#222]"
              maxLength={100}
            />
            <Text className="text-[#888] text-[12px] mt-1 text-right">
              {title.length}/100
            </Text>
          </View>

          {/* 카테고리 선택 */}
          <CategorySelector />

          {/* 우선순위 선택 */}
          <PrioritySelector />

          {/* 매장 선택 */}
          <StoreSelector />

          {/* 내용 입력 */}
          <View className="mb-6">
            <Text className="text-[16px] font-medium text-[#222] mb-3">문의 내용</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="문의하실 내용을 자세히 작성해주세요"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              className="border border-[#ddd] rounded-lg px-4 py-3 text-[16px] text-[#222] min-h-[120px]"
              maxLength={1000}
            />
            <Text className="text-[#888] text-[12px] mt-1 text-right">
              {content.length}/1000
            </Text>
          </View>

          {/* 안내 메시지 */}
          <View className="bg-[#f8f9fa] p-4 rounded-lg mb-6">
            <View className="flex-row items-start">
              <Ionicons name="information-circle-outline" size={20} color="#666" />
              <View className="ml-3 flex-1">
                <Text className="text-[#666] text-[14px] leading-5">
                  • 문의 내용은 관리자가 확인 후 답변드립니다.{'\n'}
                  • 긴급한 문의는 우선순위를 &apos;높음&apos;으로 설정해주세요.{'\n'}
                  • 답변은 보통 1-2일 내에 등록됩니다.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

