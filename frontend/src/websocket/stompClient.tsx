import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_BASE_URL = import.meta.env.VITE_APP_WEBSOCKET_URL;

export const createStompClient = (roomCode: string) => {
  return new Client({
    webSocketFactory: () => new SockJS(`${WS_BASE_URL}/rooms/${roomCode}`),
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: (str) => console.log('[STOMP]', str),
  });
};
