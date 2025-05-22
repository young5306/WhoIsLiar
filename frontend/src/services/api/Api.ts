import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '../../stores/useAuthStore';
import { notify } from '../../components/common/Toast';

export const BASE_URL = import.meta.env.VITE_APP_API_URL;

const setupInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    (config) => {
      config.withCredentials = true; // 쿠키를 항상 보내야 하니까 이것만 유지

      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        const { clearUserInfo } = useAuthStore.getState();
        clearUserInfo();
        notify({
          type: 'error',
          text: '인증이 만료되었습니다. 다시 로그인해주세요.',
        });
        window.location.href = '/';
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
    withCredentials: true, // 쿠키를 항상 보내도록 설정
  });

  setupInterceptors(instance);
  return instance;
};

export const api = createAxiosInstance();
