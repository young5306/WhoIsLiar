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
import { EmotionLogMessage } from '../services/api/FaceApiService';

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
  sendEmotion: (payload: EmotionLogMessage) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  stompClient: null,
  isConnected: false,
  connect: () => {},
  send: () => {},
  sendEmotion: () => {},
});

export const useWebSocketContext = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { roomCode: urlRoomCode } = useParams<{ roomCode: string }>();
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<StompClient | null>(null);
  const currentRoomCodeRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        // 연결 성공 시 재연결 타이머 초기화
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      client.onStompError = (frame) => {
        console.error('STOMP 에러:', frame);
        setIsConnected(false);
        // 에러 발생 시 즉시 재연결 시도
        if (currentRoomCodeRef.current && !reconnectTimeoutRef.current) {
          connect(currentRoomCodeRef.current);
        }
      };

      client.onWebSocketClose = () => {
        console.log('WebSocket 연결 종료');
        setIsConnected(false);
        // 연결 종료 시 즉시 재연결 시도
        if (currentRoomCodeRef.current && !reconnectTimeoutRef.current) {
          connect(currentRoomCodeRef.current);
        }
      };

      client.activate();
      clientRef.current = client;
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      setIsConnected(false);
      // 연결 실패 시 즉시 재연결 시도
      if (currentRoomCodeRef.current && !reconnectTimeoutRef.current) {
        connect(currentRoomCodeRef.current);
      }
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

  const sendEmotion = useCallback((payload: EmotionLogMessage) => {
    if (!clientRef.current?.connected || !currentRoomCodeRef.current) {
      console.warn('WebSocket이 연결되지 않았습니다.');
      return;
    }

    clientRef.current.publish({
      destination: `/app/emotion.send/${currentRoomCodeRef.current}`,
      body: JSON.stringify(payload),
    });
  }, []);

  // 페이지 로드/새로고침 시 연결 시도
  useEffect(() => {
    if (urlRoomCode) {
      connect(urlRoomCode);
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [urlRoomCode, connect]);

  // 주기적으로 연결 상태 확인 및 재연결
  useEffect(() => {
    const checkConnection = () => {
      if (
        currentRoomCodeRef.current &&
        (!isConnected || !clientRef.current?.connected)
      ) {
        console.log('연결 상태 확인: 재연결 시도');
        connect(currentRoomCodeRef.current);
      }
    };

    const intervalId = setInterval(checkConnection, 5000); // 5초마다 확인

    return () => {
      clearInterval(intervalId);
    };
  }, [isConnected, connect]);

  return (
    <WebSocketContext.Provider
      value={{
        stompClient: clientRef.current,
        isConnected,
        connect,
        send,
        sendEmotion,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
