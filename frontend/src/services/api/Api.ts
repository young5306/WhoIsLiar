import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/stores/useAuthStore'; // 스토어 import 필요

export const BASE_URL = import.meta.env.VITE_APP_API_URL;
export const SOCKET_URL = import.meta.env.VITE_APP_SOCKET_URL;

axios.defaults.withCredentials = false;
axios.defaults.headers.common['Content-Type'] = 'application/json';

const setupInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    (config) => {
      const { accessToken } = useAuthStore.getState();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        config.withCredentials = true;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        useAuthStore.getState().clearAccessToken();
        console.error('인증 실패: 로그아웃 처리됨');
      }
      return Promise.reject(error);
    }
  );
};

export const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  setupInterceptors(instance);
  return instance;
};

export const api = createAxiosInstance();

// 🧩 추가: WebSocket 연결 함수
export const connectWebSocket = (): WebSocket | null => {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) {
    console.error('Access Token이 없습니다. 웹소켓 연결 실패');
    return null;
  }

  const socket = new WebSocket(`${SOCKET_URL}?token=${accessToken}`);

  socket.onopen = () => {
    console.log('WebSocket 연결 완료');
  };

  socket.onerror = (error) => {
    console.error('WebSocket 연결 오류', error);
  };

  return socket;
};
