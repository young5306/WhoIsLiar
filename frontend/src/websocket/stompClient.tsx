import { Client as StompClient } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const createStompClient = (roomCode: string) => {
  const socket = new SockJS(`/ws?roomCode=${roomCode}`);

  const client = new StompClient({
    webSocketFactory: () => socket,
    // debug: (str) => console.log('[STOMP]', str),
    reconnectDelay: 5000,
  });

  return client;
};
