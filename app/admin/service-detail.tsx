import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '../../lib/supabase';
import Toast from 'react-native-toast-message';

export default function ServiceDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [request, setRequest] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      const { data: sessionData, error } = await supabase.auth.getSession();
      console.log('✅ 세션 user id:', sessionData?.session?.user.id);

      console.log('✅ 삽입할 user_id:', sessionData?.session?.user.id); // insertData.user_id랑 같아야 함
    };
  
    checkSession();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const { data: requestData } = await supabase
        .from('service_requests')
        .select('id, status, created_at, working_at, completed_at, canceled_at, services(name), stores(name, address)')
        .eq('id', id)
        .single();

      const { data: detailData } = await supabase
        .from('request_details')
        .select('key, value')
        .eq('request_id', id);

      setRequest(requestData);
      setDetails(detailData || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string, timeField: string) => {
    const now = new Date().toISOString();
    const updateData: any = { status: newStatus, [timeField]: now };
  
    // 1. 상태 업데이트
    const { error: updateError } = await supabase
      .from('service_requests')
      .update(updateData)
      .eq('id', request.id);
  
    if (updateError) {
      console.error('Supabase 업데이트 에러:', updateError);
      Toast.show({ type: 'error', text1: `${newStatus} 처리 실패`, text2: updateError.message });
      return;
    }
  
    // 2. 세션에서 user_id 가져오기
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;
  
    if (!session || !session.user) {
      console.error('❌ 세션 없음: 알림 생성 생략');
    } else {
      const userId = session.user.id;
  
      const insertData = {
        user_id: userId,
        type: 'status_update',
        title: '서비스 상태 변경',
        description: `서비스가 [${newStatus}] 상태로 변경되었습니다.`,
        icon_type:
        newStatus === '진행중' ? 'service' :
        newStatus === '완료' ? 'complete' :
        newStatus === '취소' ? 'cancel' :
        'default',
        is_read: false,
      };

  
      const { error: notificationError } = await supabase.from('notifications').insert([insertData]);
  
      if (notificationError) {
        console.error('알림 생성 실패:', notificationError);
      } else {
        console.log('✅ 알림 생성 완료');
      }
    }
  
    // 3. 로컬 상태 업데이트
    setRequest({ ...request, ...updateData });
  
    // 4. 성공 알림
    const statusMessage = {
      진행중: '요청이 수락되었습니다.',
      완료: '작업이 완료되었습니다.',
      취소: '요청이 거절되었습니다.',
    };
  
    Toast.show({
      type: 'success',
      text1: statusMessage[newStatus as keyof typeof statusMessage] || '상태가 업데이트되었습니다.',
    });
  };
  

  

  const statusConfigMap = {
    '요청됨': {
      bgColor: 'bg-[#EAF5FE]',
      title: '서비스 요청됨',
      description: '요청하신 서비스를 확인하고 있습니다.',
    },
    '진행중': {
      bgColor: 'bg-[#FEFBEA]',
      title: '작업 시행 중',
      description: '서비스가 현재 진행 중입니다.',
    },
    '완료': {
      bgColor: 'bg-[#E6F4EA]',
      title: '서비스 완료',
      description: '서비스가 성공적으로 완료되었습니다.',
    },
    '취소': {
      bgColor: 'bg-[#FFEAEA]',
      title: '서비스 취소됨',
      description: '요청하신 서비스가 취소되었습니다.',
    },
  };

  const rawSteps = [
    { label: '요청됨', timestamp: request?.created_at },
    { label: '작업 시행 중', timestamp: request?.working_at },
    { label: '서비스 완료', timestamp: request?.completed_at },
    { label: '취소됨', timestamp: request?.canceled_at },
  ];

  useEffect(() => {
    if(!request) return;
    if(request.status === '취소') {
      setCurrentStepIndex(3);
    } else {
      setCurrentStepIndex(rawSteps.findLastIndex(step => !!step.timestamp));
    }
  }, [request]);

  const stepList = rawSteps.map((step, idx) => {
    const dateTime = step.timestamp ? new Date(step.timestamp) : null;
    return {
      label: step.label,
      date: dateTime ? dateTime.toISOString().slice(5, 10).replace('-', '/') : '',
      time: dateTime ? dateTime.toTimeString().slice(0, 5) : '',
      inactive: idx > currentStepIndex,
      isActive: idx === currentStepIndex,
    };
  });

  if (loading) {
    return <ActivityIndicator className="mt-10" />;
  }

  const statusConfig = statusConfigMap[request.status as keyof typeof statusConfigMap] || statusConfigMap['요청됨'];
  const total = details.reduce((sum, d) => {
    const count = parseInt(d.value.replace(/[^0-9]/g, '')) || 0;
    return sum + count * 25000; // 가격은 임시
  }, 0);

  const getStatusTime = () => {
    let rawTime: string | null | undefined = null;
  
    switch (request.status) {
      case '요청됨':
        rawTime = request.created_at;
        break;
      case '진행중':
        rawTime = request.working_at;
        break;
      case '완료':
        rawTime = request.completed_at;
        break;
      case '취소':
        rawTime = request.canceled_at;
        break;
      default:
        return '';
    }
  
    if (!rawTime) return '';
    const dateObj = new Date(rawTime);
    const date = dateObj.toISOString().slice(0, 10).replace(/-/g, '/');
    const time = dateObj.toTimeString().slice(0, 5);
    return `${date}, ${time}`;
  };
  

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-4 pt-16 pb-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text className="text-[22px] font-bold text-[#222]">세부정보</Text>
        <View className="w-7" />
      </View>

      {/* 상태 안내 */}
      <View className={`pt-2 px-4 flex-row items-center ${statusConfig.bgColor}`}>
        <View className="flex-1">
          <Text className="text-[#222] font-bold text-[18px] p-3 py-1">{statusConfig.title}</Text>
          <Text className="text-[#222] text-[12px] p-3">{statusConfig.description}</Text>
        </View>
        <Image source={require('../../assets/star.png')} className="w-18 h-18 mt-2" resizeMode="contain" />
      </View>

      {/* 가게 정보 */}
      <View className="px-4 py-5">
        <Text className="text-[15px] text-[#222] pb-2 pl-3">
          {request?.stores?.name || '가게 정보 없음'}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-[#222] text-[12px] pl-3">{request?.stores?.address || '주소 정보 없음'}</Text>
          <Ionicons name="location-sharp" size={16} color="#EB5A36" className="ml-1" />
        </View>
      </View>

      {/* 상태 라인 위 */}
      <View className="h-px bg-[#E0E0E0] mx-0 mb-2.5" />

      {/* 상태 + 모달 버튼 */}
      <TouchableOpacity className="flex-row items-center mx-4" onPress={() => setShowModal(true)}>
        <Ionicons name="calendar-outline" size={16} color="#888" className="p-3" />
        <Text className="text-[#222] text-[12px]">{statusConfig.title} : {getStatusTime()}</Text>
        <Ionicons name="chevron-forward" size={16} color="#EB5A36" className="ml-1" />
      </TouchableOpacity>

      <View className="h-2 bg-[#E0E0E0] mx-0 my-2.5" />


      {/* 요청 항목 */}
      {/* <View className="bg-white rounded-2xl px-7 py-2">
        <Text className="font-bold text-[18px] text-[#222] mb-2">요청 항목</Text>
        {details.map((item, idx) => (
          <View key={idx} className="flex-row justify-between items-center py-2">
            <Text className="text-[15px] text-[#222]">{item.key}</Text>
            <Text className="text-[15px] text-[#EB5A36]">{item.value}</Text>
          </View>
        ))}
      </View> */}
      <View className="bg-white rounded-2xl px-7 py-4 flex-row items-center mb-4">
        {/* 서비스 아이콘
        <Image
          source={require('../../assets/burner.png')}
          className="w-14 h-14 mr-4"
          resizeMode="contain"
        /> */}
        {/* 서비스 정보 */}
        <View className="flex-1">
          <Text className="font-bold text-lg text-[#222] mb-3">화구 교체 서비스</Text>
          <View className="flex-col mb-2">
            {details.map((item, idx) => (
              <View key={idx} className="flex-row items-center mb-3">
                <Text className="text-[#888] text-base mr-2">{item.key}</Text>
                <View className="bg-[#FFF1EF] rounded-full px-2 py-0.5 ml-1">
                  <Text className="text-[#EB5A36] text-xs tracking-wider font-bold">x{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
          {/* 요청사항 자세히 보기 버튼 */}
          <TouchableOpacity className="bg-[#FFF1EF] rounded-xl px-3 py-2 mt-3 flex-row items-center w-fit">
            <Ionicons name="document-text-outline" size={16} color="#EB5A36" className="mr-2" />
            <Text className="text-[#EB5A36] text-base font-semibold">요청사항 자세히 보기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 전체 요청 금액 */}
      <View className="bg-white flex-row items-center justify-between mt-0 mx-0 border-t border-[#E0E0E0] py-4 px-7">
        <Text className="text-[#222] text-[15px] font-bold">전체 요청</Text>
        <View className="flex-row items-center">
          <Text className="text-[#EB5A36] font-bold text-[17px]">{total.toLocaleString()}원</Text>
          <TouchableOpacity className="" />
        </View>
      </View>

      {/* 회색 하단 라인 */}
      <View className="h-px bg-[#E0E0E0] mx-0" />

      {/* 모달 */}
      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 bg-black/40 justify-end mb-13">
          <View className="bg-white rounded-t-3xl pt-6 pb-10 px-6">
            <View className="flex-row justify-between items-center mb-6">
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text className="text-[#E64B32] text-[14px]">닫기</Text>
              </TouchableOpacity>
              <Text className="text-[#222] text-[16px] font-semibold">요청 처리 기록</Text>
              <View className="w-9" />
            </View>

            <View className="h-px bg-[#DBDBDB] -mx-6 mb-4" />

            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-[#888] text-[13px]">서비스 처리 ID</Text>
              <Text className="text-[#222] font-bold text-[14px]">{request?.id?.slice(0, 4)}-{request?.id?.slice(-4)}</Text>
            </View>

            <View className="h-2 bg-[#F6F6F5] -mx-6 mb-12" />


            {stepList.map((step, idx) => {
              const isLast = idx === stepList.length - 1;
              return (
                <View key={idx} className="flex-row items-start overflow-visible">
                  {/* 날짜/시간 */}
                  <View className="w-14 items-end mr-2">
                    <Text className="text-[#222] text-[13px] font-medium mb-1">{step.date}</Text>
                    <Text className="text-[#999] text-[12px]">{step.time}</Text>
                  </View>

                  {/* 타임라인 */}
                  <View className="flex-col items-center mr-3">
                    <View className={`w-[10px] h-[10px] rounded-full ${step.isActive ? 'bg-[#FF5A36]' : 'bg-[#ddd]'}`} />
                    {!isLast && <View className="w-[1px] h-20 bg-[#E0E0E0]" />}
                  </View>

                  {/* 상태 박스 */}
                  <View className={`flex-1 rounded-md -mt-5 px-4 py-5 ${step.isActive ? 'bg-[#F6F6F5]' : 'bg-[#F6F6F5]'}`}>
                    <Text className={`text-[14px] ${step.isActive ? 'text-[#222] font-bold' : 'text-[#888]'}`}>{step.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Modal>
{/* 하단 버튼 */}
{(request.status === '요청됨' || request.status === '진행중') && (
        <View className="flex-row justify-around px-6 py-4 bg-white border-t border-gray-200">
          {request.status === '요청됨' ? (
            <>
              <TouchableOpacity
                className="flex-1 mr-2 bg-[#FF5A36] py-3 rounded-xl items-center"
                onPress={() => handleStatusUpdate('진행중', 'working_at')}
              >
                <Text className="text-white font-bold text-base">수락하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 ml-2 bg-[#E0E0E0] py-3 rounded-xl items-center"
                onPress={() => handleStatusUpdate('취소', 'canceled_at')}
              >
                <Text className="text-[#222] font-bold text-base">거절하기</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                className="flex-1 mr-2 bg-[#FF5A36] py-3 rounded-xl items-center"
                onPress={() => handleStatusUpdate('완료', 'completed_at')}
              >
                <Text className="text-white font-bold text-base">완료하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 ml-2 bg-[#E0E0E0] py-3 rounded-xl items-center"
                onPress={() => handleStatusUpdate('취소', 'canceled_at')}
              >
                <Text className="text-[#222] font-bold text-base">취소하기</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
)}

    </View>
  );
}
