import axios, { AxiosInstance } from 'axios';

export const BASE_URL = import.meta.env.VITE_APP_API_URL;

axios.defaults.withCredentials = false; // 전역 설정은 일단 냅두고

const setupInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    (config) => {
      config.withCredentials = true; // 쿠키를 항상 보내야 하니까 이것만 유지

      return config;
    },
    (error) => Promise.reject(error)
  );
};

export const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });

  setupInterceptors(instance);
  return instance;
};

export const api = createAxiosInstance();
