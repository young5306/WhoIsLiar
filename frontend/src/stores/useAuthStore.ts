import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  userInfo: Record<string, any> | null; // 사용자 정보 타입 정의
  setAccessToken: (token: string) => void;
  clearAccessToken: () => void;
  setUserInfo: (info: Record<string, any>) => void; // 사용자 정보 저장 메서드
  clearUserInfo: () => void; // 사용자 정보 초기화 메서드
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      userInfo: null,
      setAccessToken: (token) => set({ accessToken: token }),
      clearAccessToken: () => set({ accessToken: null }),
      setUserInfo: (info) => set({ userInfo: info }),
      clearUserInfo: () => set({ userInfo: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
