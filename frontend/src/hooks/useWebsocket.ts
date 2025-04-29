// hooks/useWebSocket.ts
import { useWebSocketContext } from '../contexts/WebSocketProvider';

export const useWebSocket = () => {
  const { subscribe, send } = useWebSocketContext();
  return { subscribe, send };
};
