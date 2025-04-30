import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_BASE_URL = import.meta.env.VITE_APP_WEBSOCKET_URL;

export const createStompClient = (roomCode: string) => {
  return new Client({
    webSocketFactory: () =>
      new SockJS(`${WS_BASE_URL}/ws?roomCode=${roomCode}`),
    connectHeaders: {
      'Content-Type': 'application/json',
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: (str) => {
      if (import.meta.env.DEV) {
        console.log('[STOMP]', str);
      }
    },
    onStompError: (frame) => {
      console.error('STOMP error:', frame);
    },
  });
};
