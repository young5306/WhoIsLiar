import axios from 'axios';
import { StreamManager } from 'openvidu-browser';

const APPLICATION_SERVER_URL = import.meta.env.PROD
  ? import.meta.env.VITE_OVD_SERVER_URL
  : // : import.meta.env.VITE_APP_LOCAL_SERVER_URL;
    import.meta.env.VITE_APP_API_URL;

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
export const getToken = async (
  userName: string,
  sessionId: string,
  accessToken: string
): Promise<string> => {
  return await createSessionApi(userName, sessionId, accessToken);
  // console.log('getToken');
  // const createSessionId = await createSessionApi(sessionId, accessToken);
  // return await createTokenApi(createSessionId, accessToken);
};

export const createSessionApi = async (
  sessionId: string,
  accessToken: string
): Promise<string> => {
  try {
    // ck) 실제 세션 발급받는 api로 변경
    const response = await axios.post(
      APPLICATION_SERVER_URL + '/openvidu/sessions',
      // { customSessionId: sessionId },
      // { roomId: sessionId, nickname: userName },
      { roomCode: sessionId },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        // withCredentials: true,
      }
    );
    console.log('createSession res: ', response.data);
    // return response.data;
    return response.data.token;
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
