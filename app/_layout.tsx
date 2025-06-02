import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import '../global.css';

import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, Alert, View } from 'react-native';
import * as Updates from 'expo-updates';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {

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

  

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="authentication/login" options={{ headerShown: false }} />
      <Stack.Screen name="authentication/signup" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
