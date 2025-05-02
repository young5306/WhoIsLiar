// hooks/useWebSocket.ts
import { useWebSocketContext } from '../contexts/WebSocketProvider';

export const useWebSocket = () => {
  const { stompClient, send, isConnected } = useWebSocketContext();

  const subscribe = (topic: string, callback: (message: any) => void) => {
    if (stompClient?.connected) {
      return stompClient.subscribe(topic, (frame) => {
        const message = JSON.parse(frame.body);
        callback(message);
      });
    }
    return null;
  };

  return { subscribe, send, isConnected };
};
