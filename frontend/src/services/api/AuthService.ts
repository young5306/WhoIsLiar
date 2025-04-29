import { api } from './Api';

const loginApi = async (nickname: string) => {
  const res = await api.post('/auth/login', { nickname });
  return res.data.data;
};

export default loginApi;
