// contexts/WebSocketProvider.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Client } from '@stomp/stompjs';
import { createStompClient } from '../websocket/stompClient';

interface WebSocketContextType {
  subscribe: (endpoint: string, callback: (body: any) => void) => void;
  send: (destination: string, payload: any) => void;
  isConnected: boolean;
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
  const [isConnected, setIsConnected] = useState(false);
  const pendingSubscriptions = useRef<
    { endpoint: string; callback: (body: any) => void }[]
  >([]);

  useEffect(() => {
    const client = createStompClient(roomCode);
    clientRef.current = client;

    client.onConnect = () => {
      console.log('🟢 WebSocket 연결 성공');
      setIsConnected(true);

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
      setIsConnected(false);
    };

    client.onWebSocketClose = () => {
      console.log('🔴 WebSocket 연결 종료');
      setIsConnected(false);
    };

    client.activate();

    return () => {
      if (clientRef.current?.connected) {
        clientRef.current.deactivate();
      }
      setIsConnected(false);
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
    if (!clientRef.current?.connected) {
      console.warn('⚠️ WebSocket이 연결되지 않았습니다.');
      return;
    }
    clientRef.current.publish({
      destination,
      body: JSON.stringify(payload),
    });
  };

  return (
    <WebSocketContext.Provider value={{ subscribe, send, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('WebSocketProvider가 필요합니다.');
  return ctx;
};
