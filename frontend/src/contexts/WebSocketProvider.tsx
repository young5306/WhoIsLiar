// contexts/WebSocketProvider.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { Client as StompClient } from '@stomp/stompjs';
import { createStompClient } from '../websocket/stompClient';
import { useParams } from 'react-router-dom';

interface Message {
  sender: string;
  content: string;
  chatType: string;
}

interface WebSocketContextType {
  stompClient: StompClient | null;
  isConnected: boolean;
  connect: (roomCode: string) => void;
  send: (content: string, sender: string, chatType: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  stompClient: null,
  isConnected: false,
  connect: () => {},
  send: () => {},
});

export const useWebSocketContext = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { roomCode: urlRoomCode } = useParams<{ roomCode: string }>();
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<StompClient | null>(null);
  const currentRoomCodeRef = useRef<string | null>(null);

  const connect = useCallback((roomCode: string) => {
    if (!roomCode) {
      console.error('roomCode가 없습니다.');
      return;
    }

    try {
      console.log('WebSocket 연결 시도:', roomCode);
      currentRoomCodeRef.current = roomCode;
      const client = createStompClient(roomCode);

      client.onConnect = () => {
        console.log('STOMP 연결 성공');
        setIsConnected(true);
      };

      client.onStompError = (frame) => {
        console.error('STOMP 에러:', frame);
        setIsConnected(false);
      };

      client.onWebSocketClose = () => {
        console.log('WebSocket 연결 종료');
        setIsConnected(false);
      };

      client.activate();
      clientRef.current = client;
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      setIsConnected(false);
    }
  }, []);

  const send = useCallback(
    (content: string, sender: string, chatType: string) => {
      if (!clientRef.current?.connected || !currentRoomCodeRef.current) {
        console.warn('WebSocket이 연결되지 않았습니다.');
        return;
      }

      const message: Message = {
        sender,
        content,
        chatType,
      };

      clientRef.current.publish({
        destination: `/app/chat.send/${currentRoomCodeRef.current}`,
        body: JSON.stringify(message),
      });
    },
    []
  );

  useEffect(() => {
    if (urlRoomCode) {
      connect(urlRoomCode);
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [urlRoomCode, connect]);

  return (
    <WebSocketContext.Provider
      value={{ stompClient: clientRef.current, isConnected, connect, send }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
