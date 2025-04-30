import { api } from './Api';

interface createRoomRequest {
  hostNickname: string; // 방장 닉네임
  mode: string; // 'VIDEO' or 'BLIND'
  roomName: string; // 방 이름
  password: string; // 숫자 4자리
  roundCount: number; // 3, 4, 5
}

export const createRoom = async (param: createRoomRequest) => {
  const res = await api.post('/rooms', param);
  return res.data;
};
