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

// ck) 서버 통신
export const getToken = async (sessionId: string): Promise<string> => {
  return await createSessionApi(sessionId);
};

export const createSessionApi = async (sessionId: string): Promise<string> => {
  try {
    const response = await api.post(`/openvidu/sessions/${sessionId}`, {});
    // console.log('createSession res: ', response.data.data);
    return response.data.data.token;
  } catch (error) {
    console.error('세션 생성 중 오류 발생: ', error);
    throw error;
  }
};

// export const createTokenApi = async (
//   sessionId: string,
//   accessToken: string
// ): Promise<string> => {
//   console.log('createTokenApi:', sessionId, accessToken);

//   try {
//     const response = await axios.post(
//       APPLICATION_SERVER_URL + '/sessions/' + sessionId + '/connections',
//       {},
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           // Authorization: `Bearer ${accessToken}`,
//         },
//         // withCredentials: true,
//       }
//     );
//     console.log('createToken res: ', response);
//     return response.data;
//   } catch (error) {
//     console.log('토큰 생성 중 오류 발생: ', error);
//     throw error;
//   }
// };

// 게임 시작
// POST /api/rooms/game/start
export const startGame = async (roomCode: string) => {
  const res = await api.post(`/rooms/game/start`, { roomCode });
  return res.data;
};

// 라운드 세팅
// [POST] /api/rounds/setting
export const setRound = async (params: setRoundRequest) => {
  const res = await api.post(`/rounds/setting`, { params });
  return res.data;
};

// 라운드 세팅 개인 정보 가져오기
// /api/rounds/{roomCode}/{roundNumber}/player-info
export const getPlayerInfo = async (roomCode: string, roundNumber: number) => {
  const res = await api.get(`/rounds/${roomCode}/${roundNumber}/player-info`);
  return res.data;
};

// 라운드 시작
// /api/rounds/start
export const startRound = async (roomCode: string, roundNumber: number) => {
  const res = await api.post(`/rounds/start`, { roomCode, roundNumber });
  return res.data;
};

// 게임 종료(라운드 삭제)
// [DELETE] /api/rounds/{roomCode}/end
export const endRound = async (roomCode: string) => {
  const res = await api.delete(`/rounds/${roomCode}/end`);
  return res.data;
};

// 방 나가기
// [DELETE] /api/rooms/{roomCode}/out
export const outRoom = async (roomCode: string) => {
  const res = await api.delete(`/rooms/${roomCode}/out`);
  return res.data;
};
