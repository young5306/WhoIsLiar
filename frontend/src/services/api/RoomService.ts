import { api } from './Api';

interface createRoomRequest {
  hostNickname: string; // 방장 닉네임
  videoMode: string; // 'VIDEO' or 'BLIND'
  gameMode: string; // 'DEFAULT' or 'FOOL'
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
  mode: 'VIDEO' | 'BLIND';
  category: string;
  hostNickname: string;
  status: 'waiting' | 'playing';
}

export interface RoomParticipant {
  participantId: number;
  nickName: string;
  isActive: boolean;
  readyStatus: boolean;
  isHost: boolean;
}

export interface RoomParticipantsWrapper {
  participants: RoomParticipant[];
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

export const joinRoomByCode = async (roomCode: string) => {
  await api.post('/rooms/join/code', { roomCode });
};

export const joinRoomByPassword = async (
  roomCode: string,
  password: string
) => {
  await api.post('/rooms/join/password', { roomCode, password });
};

export const getRoomData = async (roomCode: string) => {
  const res = await api.get(`/rooms/${roomCode}`);
  return res.data.data;
};

export const getRoomParticipants = async (roomCode: string) => {
  const res = await api.get(`/rooms/${roomCode}/participants`);
  console.log('getRoomParticipants', res);
  return res.data.data;
};

// POST /api/rooms/setting
// Content-Type: application/json

// {
// 	"roomCode": "abcd12",
// 	"category": "음식"
// }
export const setRoomCategory = async (roomCode: string, category: string) => {
  const res = await api.post('/rooms/category', { roomCode, category });
  return res.data;
};

export const roomReady = async (roomCode: string) => {
  const res = await api.post(`/rooms/${roomCode}/ready`);
  return res.data;
};
