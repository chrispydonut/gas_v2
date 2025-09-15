// import React, { useEffect, useState, useCallback } from 'react';
// import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter, useFocusEffect } from 'expo-router';
// import { supabase } from '../../lib/supabase';

// export default function Inquiry() {
//   const router = useRouter();
//   const [conversations, setConversations] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [profile, setProfile] = useState<any>(null);

//   useFocusEffect(
//   useCallback(() => {
//     let isActive = true;

//     const fetchConversations = async () => {
//       setLoading(true);
//       const { data: userData, error: userError } = await supabase.auth.getUser();
//       const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', userData.user?.id).single();
//       console.log("profileData", profileData);
//       setProfile(profileData);
//       if (userError) {
//         console.warn('유저 정보 불러오기 실패:', userError.message);
//         setLoading(false);
//         return;
//       }

//       const userId = userData.user?.id;
//       console.log('🔍 현재 유저 ID:', userId);

//       if (!userId) {
//         console.warn('❗ 유저 ID 없음 — 로그인 상태 확인 필요');
//         setLoading(false);
//         return;
//       }

//       const { data, error } = await supabase
//         .from('conversations')
//         .select('id, updated_at, messages(content, created_at)')
//         .eq('user_id', userId)
//         .order('updated_at', { ascending: false });

//       if (isActive) {
//         if (error) {
//           console.warn('대화 불러오기 실패:', error.message);
//         } else {
//           setConversations(data || []);
//         }
//         setLoading(false);
//       }
//     };

//     fetchConversations();

//     return () => {
//       isActive = false;
//     };
//   }, [])
// );
  

//   const formatTime = (iso: string) => {
//     const date = new Date(iso);
//     const now = new Date();
//     const isToday = date.toDateString() === now.toDateString();
//     return isToday
//       ? date.toTimeString().slice(0, 5)
//       : date.toISOString().slice(0, 10).replace(/-/g, '/');
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       {/* 상단 헤더 */}
//       <View className="pt-4 flex-row items-center justify-between px-[18px] mb-3">
//         <TouchableOpacity onPress={() => router.replace('/')}> 
//           <Ionicons name="chevron-back" size={28} color="#222" />
//         </TouchableOpacity>
//         <Text className="text-[22px] font-bold text-[#222]">문의하기</Text>
//         <TouchableOpacity
//           onPress={async () => {
//             const { data: userData } = await supabase.auth.getUser();
//             const userId = userData.user?.id;
//             if (!userId) return;

//             // 이미 진행 중인 빈 대화가 있는지 확인
//             const { data: existing } = await supabase
//               .from('conversations')
//               .select('id')
//               .eq('user_id', userId)
//               .is('admin_id', 'f0887d78-02cc-4e94-a9a5-76baf8bac9f4') // 아직 할당되지 않은
//               .order('created_at', { ascending: false })
//               .limit(1)
//               .maybeSingle();

//             let conversationId = existing?.id;

//             // 없으면 새로 생성
//             if (!conversationId) {
//               const { data: created, error } = await supabase
//                 .from('conversations')
//                 .insert({ user_id: userId, admin_id: 'f0887d78-02cc-4e94-a9a5-76baf8bac9f4', store_id: profile?.default_store_id })
//                 .select()
//                 .single();

//               if (error || !created) {
//                 console.warn('새 문의 생성 실패:', error?.message);
//                 return;
//               }

//               conversationId = created.id;
//             }

//             router.push(`/service/center?conversation_id=${conversationId}`);
//           }}
//         >
//           <Ionicons name="create-outline" size={26} color="#222" />
//         </TouchableOpacity>
//       </View>

//       {/* 문의 내역 리스트 */}
//       {loading ? (
//         <ActivityIndicator className="mt-10 text-[#FF5A36]" />
//       ) : (
//         conversations.length > 0 ? (
//           <FlatList
//           data={conversations}
//           keyExtractor={item => item.id.toString()}
//           refreshing={loading}
//           onRefresh={async () => {
//             setLoading(true);
//             const { data: userData, error: userError } = await supabase.auth.getUser();
//             const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userData.user?.id).single();
//             setProfile(profileData);
        
//             const userId = userData.user?.id;
//             if (!userId) {
//               console.warn('❗ 유저 ID 없음 — 로그인 상태 확인 필요');
//               setLoading(false);
//               return;
//             }
        
//             const { data, error } = await supabase
//               .from('conversations')
//               .select('id, updated_at, messages(content, created_at)')
//               .eq('user_id', userId)
//               .order('updated_at', { ascending: false });
        
//             if (error) {
//               console.warn('대화 불러오기 실패:', error.message);
//             } else {
//               setConversations(data || []);
//             }
//             setLoading(false);
//           }}
//           renderItem={({ item }) => {
//             const latestMessage = item.messages?.[item.messages.length - 1];
//             return (
//               <TouchableOpacity
//                 onPress={() => router.push(`/service/center?conversation_id=${item.id}`)}
//                 className="px-5 py-4 border-b border-[#eee]"
//               >
//                 <View className="flex-row justify-between items-center">
//                   <Text className="font-bold text-[16px] text-[#222]">문의 내역</Text>
//                   <Text className="text-[#888] text-[13px]">
//                     {latestMessage ? formatTime(latestMessage.created_at) : formatTime(item.updated_at)}
//                   </Text>
//                 </View>
//                 <Text className="text-[#888] text-[13px] mt-1">
//                   {latestMessage?.content || '(메시지 없음)'}
//                 </Text>
//               </TouchableOpacity>
//             );
//           }}
//         />
        
//         ) : (
//           <View className="flex-1 justify-center items-center">
//             <Text className="text-[#888] text-[14px]">문의 내역이 없습니다.</Text>
//           </View>
//         )
//       )}
//     </SafeAreaView>
//   );
// }

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface Inquiry {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  stores?: {
    name: string;
  } | null;
  inquiry_responses?: {
    id: string;
    content: string;
    created_at: string;
  }[];
}

export default function Inquiry() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case '접수됨': return '#FF9500';
      case '처리중': return '#007AFF';
      case '완료': return '#34C759';
      case '보류': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    return status;
  };

  const fetchInquiries = async () => {
    setLoading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.warn('유저 정보 불러오기 실패:', userError.message);
      setLoading(false);
      return;
    }

    const userId = userData.user?.id;
    if (!userId) {
      console.warn('❗ 유저 ID 없음 — 로그인 상태 확인 필요');
      setLoading(false);
      return;
    }

    // 문의글 목록 가져오기
    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        id,
        title,
        content,
        category,
        status,
        priority,
        created_at,
        updated_at,
        stores(name),
        inquiry_responses(id, content, created_at)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('문의글 불러오기 실패:', error.message);
    } else {
      const formattedData = (data || []).map(item => ({
        ...item,
        stores: Array.isArray(item.stores) ? item.stores[0] : item.stores
      }));
      setInquiries(formattedData as Inquiry[]);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchInquiries();
    }, [])
  );

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday
      ? date.toTimeString().slice(0, 5)
      : date.toISOString().slice(0, 10).replace(/-/g, '/');
  };

  const renderInquiryItem = ({ item }: { item: Inquiry }) => {
    const hasResponse = item.inquiry_responses && item.inquiry_responses.length > 0;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/service/inquiry-detail?inquiry_id=${item.id}`)}
        className="px-5 py-4 border-b border-[#eee] bg-white"
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-3">
            <Text className="font-bold text-[16px] text-[#222] mb-1" numberOfLines={1}>
              {item.title}
            </Text>
            <Text className="text-[#666] text-[13px] mb-2" numberOfLines={2}>
              {item.content}
            </Text>
          </View>
          <View className="items-end">
            <View 
              className="px-2 py-1 rounded-full mb-1"
              style={{ backgroundColor: getStatusColor(item.status) + '20' }}
            >
              <Text 
                className="text-[11px] font-medium"
                style={{ color: getStatusColor(item.status) }}
              >
                {getStatusText(item.status)}
              </Text>
            </View>
            <Text className="text-[#888] text-[11px]">
              {formatTime(item.updated_at)}
            </Text>
          </View>
        </View>
        
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Text className="text-[#888] text-[12px] mr-3">
              {item.category}
            </Text>
            {item.stores?.name && (
              <Text className="text-[#888] text-[12px]">
                {item.stores.name}
              </Text>
            )}
          </View>
          
          {hasResponse && (
            <View className="flex-row items-center">
              <Ionicons name="chatbubble-outline" size={14} color="#007AFF" />
              <Text className="text-[#007AFF] text-[12px] ml-1">
                답변 {item.inquiry_responses?.length || 0}개
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 상단 헤더 */}
      <View className="pt-4 flex-row items-center justify-between px-[18px] mb-3">
        <TouchableOpacity onPress={() => router.replace('/')}> 
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text className="text-[22px] font-bold text-[#222]">문의하기</Text>
        <TouchableOpacity
          onPress={() => router.push('/service/inquiry-create')}
        >
          <Ionicons name="create-outline" size={26} color="#222" />
        </TouchableOpacity>
      </View>

      {/* 문의 내역 리스트 */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EB5A36" />
        </View>
      ) : (
        inquiries.length > 0 ? (
          <FlatList
            data={inquiries}
            keyExtractor={item => item.id.toString()}
            renderItem={renderInquiryItem}
            refreshing={loading}
            onRefresh={fetchInquiries}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 justify-center items-center px-8">
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text className="text-[#888] text-[16px] mt-4 text-center">
              아직 문의 내역이 없습니다.
            </Text>
            <Text className="text-[#aaa] text-[14px] mt-2 text-center">
              우측 상단의 + 버튼을 눌러 새 문의를 작성해보세요.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/service/inquiry-create')}
              className="mt-6 bg-[#EB5A36] px-6 py-3 rounded-full"
            >
              <Text className="text-white font-medium text-[16px]">
                문의 작성하기
              </Text>
            </TouchableOpacity>
          </View>
        )
      )}
    </SafeAreaView>
  );
}

