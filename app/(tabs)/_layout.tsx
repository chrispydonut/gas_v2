import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
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
