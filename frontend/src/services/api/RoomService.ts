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

export interface VoteResultItem {
  targetNickname: string;
  voteCount: number;
}

export interface VoteResultResponse {
  roomCode: string;
  roundNumber: number;
  results: VoteResultItem[]; // 득표자 정보
  selected: string; // 최다 득표자 닉네임
  detected: boolean; // 라이어 적발 여부
  liarNickname: string; // 라이어의 닉네임
}

export interface ScoreItem {
  nickname: string;
  totalScore: number;
}

export interface ScoreResponse {
  roomCode: string;
  roundNumber: number;
  scores: ScoreItem[];
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

export const getVoteResult = async (
  roomCode: string,
  roundNumber: number
): Promise<VoteResultResponse> => {
  const res = await api.get(
    `/api/rooms/${roomCode}/rounds/${roundNumber}/votes/results`
  );
  return res.data.data;
};

export const submitWordGuess = async (
  roomCode: string,
  roundNumber: number,
  guessText: string
) => {
  const res = await api.post(
    `/api/rooms/${roomCode}/rounds/${roundNumber}/guess`,
    {
      guessText,
    }
  );
  return res.data;
};

export const getRoomScores = async (
  roomCode: string
): Promise<ScoreResponse> => {
  const res = await api.get(`/api/rooms/${roomCode}/scores`);
  
export const getRoomParticipants = async (roomCode: string) => {
  const res = await api.get(`/rooms/${roomCode}/participants`);
  return res.data.data;
};
