import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://keiciweliichfgwdzoyc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlaWNpd2VsaWljaGZnd2R6b3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTg5MDEsImV4cCI6MjA2Mjg3NDkwMX0.vmOeQ0n1EUq0DFOZxzRfSAB5WoItTIFZpcyU7kQFHgo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
    autoRefreshToken: true,
    storage: AsyncStorage,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native'
    }
  }
})

// Supabase 연결 테스트 함수
export const testSupabaseConnection = async () => {
  try {
    // 서버 상태 확인
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase 연결 테스트 실패:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
    
    console.log('Supabase 연결 성공!');
    return {
      success: true,
      data: {
        connected: true,
        url: supabaseUrl
      }
    };
  } catch (err) {
    console.error('Supabase 연결 테스트 중 예외 발생:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : '알 수 없는 오류'
    };
  }
}