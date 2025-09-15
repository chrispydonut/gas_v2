// import React, { useCallback, useEffect, useState } from 'react';
// import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useFocusEffect, useRouter } from 'expo-router';
// import { supabase } from '../../../lib/supabase';

// export default function AdminInquiry() {
//   const router = useRouter();
//   const [conversations, setConversations] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

  
//   useFocusEffect(
//     useCallback(() => {
//       let isActive = true;
//       const fetchConversations = async () => {
//         // 로그인된 유저 정보 가져오기
//         const getUserId = async () => {
//           const { data, error } = await supabase.auth.getUser();
//           if (error) {
//             console.warn('유저 정보 불러오기 실패:', error.message);
//           } else {
//             console.log('로그인된 유저:', data.user);  // <-- 여기에서 user.id 찍힘
//           }
//         };
//         getUserId();
            
//         const { data, error } = await supabase
//           .from('conversations')
//           .select(`
//             id,
//             user_id,
//             store_id,
//             updated_at,
//             messages(content, created_at),
//             stores(name)
//           `)
//           .order('updated_at', { ascending: false });

//         if (error) {
//           console.warn('대화 불러오기 실패:', error.message);
//         } else {
//           setConversations(data || []);
//         }

//         setLoading(false);
//       };

//       fetchConversations();

//       return () => {
//         isActive = false;
//       };
//     }, [])
//   );
  

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
//       <View className="pt-4 flex-row items-center justify-between px-[18px] mb-3">
//         <TouchableOpacity onPress={() => router.back()}>
//           <Ionicons name="chevron-back" size={28} color="#222" />
//         </TouchableOpacity>
//         <Text className="text-[22px] font-bold text-[#222]">전체 문의</Text>
//         <View style={{ width: 30 }} />
//       </View>

//       {loading ? (
//         <ActivityIndicator className="mt-10" />
//       ) : (
//         conversations.length > 0 ? (
//         <FlatList
//           data={conversations}
//           keyExtractor={item => item.id.toString()}
//           renderItem={({ item }) => {
//             const latestMessage = item.messages?.[item.messages.length - 1];
//             return (
//               <TouchableOpacity
//                 // ⬇️ 채팅방으로 이동!
//                 onPress={() => router.push(`/admin/center?conversation_id=${item.id}`)}
//                 className="px-5 py-4 border-b border-[#eee]"
//               >
//                 <View className="flex-row justify-between items-center">
//                   <Text className="font-bold text-[16px] text-[#222]">
//                     {/* ⬇️ 가게 이름 표시 */}
//                     {item.stores?.name || '(이름없음)'}
//                   </Text>
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
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

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
  };
  inquiry_responses: {
    id: string;
    content: string;
    created_at: string;
  }[];
}

export default function AdminInquiry() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '접수됨' | '처리중' | '완료' | '보류'>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case '접수됨': return '#FF9500';
      case '처리중': return '#007AFF';
      case '완료': return '#34C759';
      case '보류': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '높음': return '#FF3B30';
      case '보통': return '#FF9500';
      case '낮음': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const fetchInquiries = async () => {
    setLoading(true);
    
    try {
      let query = supabase
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
        .order('updated_at', { ascending: false });

      // 필터 적용
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('문의글 불러오기 실패:', error.message);
      } else {
        const formattedData = (data || []).map(item => ({
          ...item,
          stores: Array.isArray(item.stores) ? item.stores[0] : item.stores
        }));
        setInquiries(formattedData as Inquiry[]);
      }
    } catch (error) {
      console.error('문의글 불러오기 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInquiries();
    }, [filter])
  );

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday
      ? date.toTimeString().slice(0, 5)
      : date.toISOString().slice(0, 10).replace(/-/g, '/');
  };

  const getStatusCount = (status: string) => {
    return inquiries.filter(inquiry => inquiry.status === status).length;
  };

  const renderFilterButton = (filterValue: typeof filter, label: string, count?: number) => (
    <TouchableOpacity
      onPress={() => setFilter(filterValue)}
      className={`mr-3 px-4 py-2 rounded-full border ${
        filter === filterValue
          ? 'bg-[#EB5A36] border-[#EB5A36]'
          : 'bg-white border-[#ddd]'
      }`}
    >
      <Text
        className={`text-[14px] ${
          filter === filterValue ? 'text-white font-medium' : 'text-[#666]'
        }`}
      >
        {label} {count !== undefined && `(${count})`}
      </Text>
    </TouchableOpacity>
  );

  const renderInquiryItem = ({ item }: { item: Inquiry }) => {
    const hasResponse = item.inquiry_responses && item.inquiry_responses.length > 0;
    const isUrgent = item.priority === '높음';

    return (
      <TouchableOpacity
        onPress={() => router.push(`/admin/inquiry-detail?inquiry_id=${item.id}`)}
        className="px-5 py-4 border-b border-[#eee] bg-white"
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-1">
              {isUrgent && (
                <Ionicons name="warning" size={16} color="#FF3B30" style={{ marginRight: 4 }} />
              )}
              <Text className="font-bold text-[16px] text-[#222]" numberOfLines={1}>
                {item.title}
              </Text>
            </View>
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
                {item.status}
              </Text>
            </View>
            <Text className="text-[#888] text-[11px]">
              {formatTime(item.updated_at)}
            </Text>
          </View>
        </View>
        
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View 
              className="px-2 py-1 rounded-full mr-2"
              style={{ backgroundColor: getPriorityColor(item.priority) + '20' }}
            >
              <Text 
                className="text-[10px] font-medium"
                style={{ color: getPriorityColor(item.priority) }}
              >
                {item.priority}
              </Text>
            </View>
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
                답변 {item.inquiry_responses.length}개
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="pt-4 flex-row items-center justify-between px-[18px] mb-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text className="text-[22px] font-bold text-[#222]">전체 문의</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* 필터 버튼들 */}
      <View className="px-5 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterButton('all', '전체', inquiries.length)}
          {renderFilterButton('접수됨', '접수됨', getStatusCount('접수됨'))}
          {renderFilterButton('처리중', '처리중', getStatusCount('처리중'))}
          {renderFilterButton('완료', '완료', getStatusCount('완료'))}
          {renderFilterButton('보류', '보류', getStatusCount('보류'))}
        </ScrollView>
      </View>

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
              {filter === 'all' ? '문의 내역이 없습니다.' : `${filter} 상태의 문의가 없습니다.`}
            </Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
}

