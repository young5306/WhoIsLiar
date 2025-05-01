// hooks/useWebSocket.ts
import { useWebSocketContext } from '../contexts/WebSocketProvider';

export const useWebSocket = () => {
  const { subscribe, send, isConnected } = useWebSocketContext();
  return { subscribe, send, isConnected };
};
