import { api } from './Api';

export const loginApi = async (nickname: string) => {
  const res = await api.post('/auth/login', { nickname });
  return res.data.data;
};

export const logoutApi = async () => {
  const res = await api.post('/auth/logout');
  return res.data.data;
};
