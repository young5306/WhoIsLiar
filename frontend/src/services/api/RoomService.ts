import { api } from './Api';

interface createRoomRequest {
  hostNickname: string; // 방장 닉네임
  mode: string; // 'VIDEO' or 'BLIND'
  roomName: string; // 방 이름
  password: string; // 숫자 4자리
  roundCount: number; // 3, 4, 5
}

export interface RoomSummary {
  roomName: string;
  roomCode: string;
  isSecret: boolean;
  playerCount: number;
  roundCount: number;
  mode: 'video' | 'blind';
  category: string;
  hostNickname: string;
  status: 'waiting' | 'playing';
}

export const createRoom = async (param: createRoomRequest) => {
  const res = await api.post('/rooms', param);
  return res.data;
};

export const getRoomList = async (
  roomName?: string
): Promise<RoomSummary[]> => {
  const res = await api.get('/rooms', {
    params: roomName ? { roomName } : {},
  });
  return res.data.data.rooms;
};

export const getRoomData = async (roomCode: string) => {
  const res = await api.get(`/rooms/${roomCode}`);
  return res.data.data;
};
