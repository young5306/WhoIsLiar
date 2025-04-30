import axios from 'axios';
import { StreamManager } from 'openvidu-browser';

const APPLICATION_SERVER_URL = import.meta.env.PROD
  ? import.meta.env.VITE_OVD_SERVER_URL
  : import.meta.env.VITE_APP_LOCAL_SERVER_URL;

export interface Subscriber extends StreamManager {
  id: string;
  nickname?: string;
  index?: number;
  position?: number;
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

// ck) 서버 통신
export const getToken = async (sessionId: string): Promise<string> => {
  const createSessionId = await createSessionApi(sessionId);
  return await createTokenApi(createSessionId);
};

export const createSessionApi = async (sessionId: string): Promise<string> => {
  try {
    // ck) 실제 세션 발급받는 api로 변경
    const response = await axios.post(
      APPLICATION_SERVER_URL + 'api/sessions',
      { customSessionId: sessionId },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('createSession res: ', response);
    return response.data;
  } catch (error) {
    console.error('세션 생성 중 오류 발생: ', error);
    throw error;
  }
};

export const createTokenApi = async (sessionId: string): Promise<string> => {
  try {
    const response = await axios.post(
      APPLICATION_SERVER_URL + 'api/sessions/' + sessionId + '/connections',
      {},
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('createToken res: ', response);
    return response.data;
  } catch (error) {
    console.log('토큰 생성 중 오류 발생: ', error);
    throw error;
  }
};
