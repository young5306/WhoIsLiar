// stompClient.ts
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const createStompClient = (roomCode: string) => {
  return new Client({
    webSocketFactory: () =>
      new SockJS(`${import.meta.env.VITE_APP_API_URL}/ws/rooms/${roomCode}`),
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: (str) => console.log('[STOMP]', str),
  });
};
