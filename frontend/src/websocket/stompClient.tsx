import { Client as StompClient } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_URL = import.meta.env.VITE_APP_WEBSOCKET_URL;

export const createStompClient = (roomCode: string) => {
  const socket = new SockJS(`${API_URL}?roomCode=${roomCode}`);

  const client = new StompClient({
    webSocketFactory: () => socket,
    // debug: (str) => console.log('[STOMP]', str),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  return client;
};
