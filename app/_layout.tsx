import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import '../global.css';

import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error("Session error:", error)
        }
        if (session) {
          console.log("Session found:", session)
          setIsLoggedIn(true)
        }
      } catch (err) {
        console.error("Unexpected error in getSession:", err)
      } finally {
        setIsLoading(false)
      }
    }
  
    checkSession()
  }, [])

  // if (!isLoggedIn) {
  //   return <Redirect href="/authentication/login" />
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
