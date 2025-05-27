import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: 'black',
        }}
      >
        <Tabs.Screen
          name="admin-service"
          options={{
            title: '서비스 관리',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="admin-store"
          options={{
            title: '가게 관리',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="construct-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="admin-contact"
          options={{
            title: '문의하기',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="mail-outline" size={size} color={color} />,
          }}
        />
      </Tabs>
      {/* ✅ Toast는 탭 바깥에 위치해야 전체 페이지에서 동작함 */}
      <Toast />
    </View>
  );
}
