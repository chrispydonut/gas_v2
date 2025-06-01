import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import '../global.css';

import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, Alert, View } from 'react-native';
import * as Updates from 'expo-updates';
import { getKeyHashAndroid } from '@react-native-kakao/core';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  // useEffect(() => {
  //   getKeyHashAndroid().then(console.log);
  // }, []);

  useEffect(() => {

    const checkForUpdates = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert("업데이트가 있습니다", "앱을 재시작합니다", [
            { text: "확인", onPress: () => Updates.reloadAsync() },
          ]);
        }
      } catch (e) {
        console.error("업데이트 확인 실패", e);
      }
    };
  
    checkForUpdates();
  }, []);

  // const [isLoading, setIsLoading] = useState(true);
  // const [hasUser, setHasUser] = useState<boolean | null>(null);

  // useEffect(() => {
  //   const checkUser = async () => {
  //     try {
  //       const { data: sessionData } = await supabase.auth.getSession();
  //       if (!sessionData.session) {
  //         setHasUser(false);
  //         setIsLoading(false);
  //         return;
  //       }
  
  //       const { data: userData, error: userError } = await supabase.auth.getUser();
  //       if (userError || !userData.user) {
  //         console.error('User 확인 실패:', userError?.message);
  //         setHasUser(false);
  //       } else {
  //         setHasUser(true);
  //       }
  //     } catch (err) {
  //       console.error('예외 발생:', err);
  //       setHasUser(false);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  
  //   checkUser();
  // }, []);

  // if (isLoading || hasUser === null) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <ActivityIndicator size="large" color="#EB5A36" />
  //     </View>
  //   );
  // }

  // if (!hasUser) {
  //   return <Redirect href="/authentication/login" />;
  // }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="authentication/login" options={{ headerShown: false }} />
      <Stack.Screen name="authentication/signup" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
