import { api } from './Api';
import { StreamManager } from 'openvidu-browser';

export interface Subscriber extends StreamManager {
  id: string;
  nickname?: string;
  index?: number;
  position?: number;
  isVideoEnabled?: boolean;
}

export interface GameState {
  round: number;
  turn: number;
  category: string;
  topic: string;
  message: Message[];
}

export interface PlayerState {
  currentPlayer: string;
  isLiar: boolean;
}

export interface Message {
  sender: string;
  content: string;
  type: 'system' | 'chat';
}

export interface setRoundRequest {
  roomCode: string;
  roundNumber: number;
  gameMode: string;
  category: string;
}

export interface VoteResultItem {
  targetNickname: string | null;
  voteCount: number;
}

export interface VoteResultResponse {
  results: VoteResultItem[]; // 득표자 정보
  skip: boolean;
  selected: string; // 최다 득표자 닉네임
  detected: boolean; // 라이어 적발 여부
  liarNickname: string; // 라이어의 닉네임
  liarId: number;
}

export interface WordGuessResponse {
  correct: boolean;
  winner: 'LIAR' | 'CIVILIAN';
}

export interface ScoreItem {
  participantNickname: string;
  totalScore: number;
}

export interface ScoreResponse {
  scores: ScoreItem[];
}

// ck) 서버 통신
export const getToken = async (sessionId: string): Promise<string> => {
  return await createSessionApi(sessionId);
};

export const createSessionApi = async (sessionId: string): Promise<string> => {
  try {
    const response = await api.post(`/openvidu/sessions/${sessionId}`, {});
    return response.data.data.token;
  } catch (error) {
    console.error('세션 생성 중 오류 발생: ', error);
    throw error;
  }
};

// 게임 시작
// POST /api/rooms/game/start
export const startGame = async (roomCode: string) => {
  const res = await api.post(`/rooms/game/start`, { roomCode });
  return res.data;
};

// 라운드 세팅
// [POST] /api/rounds/setting
export const setRound = async (roomCode: string) => {
  const res = await api.post(`/rounds/setting`, { roomCode });
  return res.data;
};

// 라운드 세팅 개인 정보 가져오기
// /api/rounds/player-info/{roomCode}
export const getPlayerInfo = async (roomCode: string) => {
  const res = await api.get(`/rounds/player-info/${roomCode}`);
  return res.data;
};

// 라운드 시작
// /api/rounds/start
export const startRound = async (roomCode: string, roundNumber: number) => {
  const res = await api.post(`/rounds/start`, { roomCode, roundNumber });
  return res.data;
};

// 라운드 종료
// /api/rounds/end
export const endRound = async (roomCode: string, roundNumber: number) => {
  const res = await api.post(`/rounds/end`, { roomCode, roundNumber });
  return res.data;
};

// 턴 시작
export const startTurn = async (roomCode: string, roundNumber: number) => {
  const res = await api.post(`/rounds/turn/start`, { roomCode, roundNumber });
  return res.data;
};

// 턴 종료(다음 턴으로)
export const updateTurn = async (roomCode: string, roundNumber: number) => {
  const res = await api.post(`/rounds/turn/update`, { roomCode, roundNumber });
  return res.data;
};

// 턴 스킵
export const skipTurn = async (roomCode: string) => {
  const res = await api.post(`/rounds/turn/skip`, { roomCode });
  return res.data;
};

// 게임 종료(라운드 삭제)
// [DELETE] /api/rounds/{roomCode}/end
export const endGame = async (roomCode: string) => {
  const res = await api.delete(`/rounds/${roomCode}/end`);
  return res.data;
};

// 방 나가기
// [DELETE] /api/rooms/{roomCode}/out
export const outRoom = async (roomCode: string) => {
  const res = await api.delete(`/rooms/${roomCode}/out`);
  return res.data;
};

// 투표 제출
export const submitVotes = async (
  roomCode: string,
  roundNumber: number,
  targetParticipantNickname: string | null
) => {
  const res = await api.post(`/rounds/${roomCode}/${roundNumber}/votes`, {
    targetParticipantNickname,
  });
  return res.data;
};

// 투표 결과 조회
export const getVoteResult = async (
  roomCode: string,
  roundNumber: number
): Promise<VoteResultResponse> => {
  const res = await api.get(`/rounds/${roomCode}/${roundNumber}/votes/results`);
  return res.data.data;
};

// 라이어 제시어 제출
export const submitWordGuess = async (
  roomCode: string,
  roundNumber: number,
  guessText: string
): Promise<WordGuessResponse> => {
  const res = await api.post(`/rounds/${roomCode}/${roundNumber}/guess`, {
    guessText,
  });
  return res.data.data;
};

// 점수 조회(누적)
export const getScores = async (roomCode: string): Promise<ScoreResponse> => {
  const res = await api.get(`/rounds/${roomCode}/score`);
  return res.data.data;
};
