// contexts/WebSocketProvider.tsx
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { createStompClient } from '../websocket/stompClient';

interface WebSocketContextType {
  subscribe: (endpoint: string, callback: (body: any) => void) => void;
  send: (destination: string, payload: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({
  roomCode,
  children,
}: {
  roomCode: string;
  children: React.ReactNode;
}) => {
  const clientRef = useRef<Client | null>(null);
  const pendingSubscriptions = useRef<
    { endpoint: string; callback: (body: any) => void }[]
  >([]);

  useEffect(() => {
    const client = createStompClient(roomCode);
    clientRef.current = client;

    client.onConnect = () => {
      console.log('🟢 WebSocket 연결 성공');

      // 연결 후에 구독 대기 리스트 처리
      pendingSubscriptions.current.forEach(({ endpoint, callback }) => {
        client.subscribe(endpoint, (message) => {
          const body = JSON.parse(message.body);
          callback(body);
        });
      });
      pendingSubscriptions.current = []; // 대기 리스트 초기화
    };

    client.onStompError = (frame) => {
      console.error('❌ STOMP 오류:', frame);
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [roomCode]);

  const subscribe = (endpoint: string, callback: (body: any) => void) => {
    if (clientRef.current?.connected) {
      clientRef.current.subscribe(endpoint, (message) => {
        const body = JSON.parse(message.body);
        callback(body);
      });
    } else {
      // 연결되지 않았으면 대기열에 추가
      pendingSubscriptions.current.push({ endpoint, callback });
    }
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
