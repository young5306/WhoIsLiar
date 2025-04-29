// contexts/WebSocketProvider.tsx
import { createContext, useContext, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { createStompClient } from '../websocket/stompClient';

interface WebSocketContextType {
  subscribe: (endpoint: string, callback: (body: any) => void) => void;
  send: (destination: string, payload: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({
  roomId,
  children,
}: {
  roomId: string;
  children: React.ReactNode;
}) => {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const client = createStompClient(roomId);
    clientRef.current = client;

    client.onConnect = () => {
      console.log('🟢 WebSocket 연결 성공');
    };
    client.onStompError = (frame) => {
      console.error('❌ STOMP 오류:', frame);
    };

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [roomId]);

  const subscribe = (endpoint: string, callback: (body: any) => void) => {
    clientRef.current?.subscribe(endpoint, (message) => {
      const body = JSON.parse(message.body);
      callback(body);
    });
  };

  const send = (destination: string, payload: any) => {
    clientRef.current?.publish({
      destination,
      body: JSON.stringify(payload),
    });
  };

  return (
    <WebSocketContext.Provider value={{ subscribe, send }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('WebSocketProvider가 필요합니다.');
  return ctx;
};
