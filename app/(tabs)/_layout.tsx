import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

export default function TabLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasUser, setHasUser] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          setHasUser(false);
          setIsLoading(false);
          return;
        }
  
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          console.error('User 확인 실패:', userError?.message);
          setHasUser(false);
        } else {
          setHasUser(true);
          setUser(userData.user);
        }
      } catch (err) {
        console.error('예외 발생:', err);
        setHasUser(false);
      } finally {
        setIsLoading(false);
      }
    };
  
    checkUser();
  }, []);

  if (isLoading || hasUser === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EB5A36" />
      </View>
    );
  }

  if (!hasUser && !isLoading) {
    return <Redirect href="/authentication/login" />;
  }

  if(user?.id === 'f0887d78-02cc-4e94-a9a5-76baf8bac9f4') {
    return <Redirect href="/admin/(tabs)/admin-service" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'black',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="my_service"
        options={{
          title: '나의 서비스',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="construct-outline" size={size} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: '문의하기',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="mail-outline" size={size} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />, 
        }}
      />
    </Tabs>
  );
}
