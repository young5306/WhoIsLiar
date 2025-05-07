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
