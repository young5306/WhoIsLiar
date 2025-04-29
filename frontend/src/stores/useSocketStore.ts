import { create } from 'zustand';

export type SocketMessage = {
  eventType: string;
  payload: any;
};

interface SocketStoreState {
  latestMessage: SocketMessage | null;
  setLatestMessage: (msg: SocketMessage) => void;
}

export const useSocketStore = create<SocketStoreState>((set) => ({
  latestMessage: null,
  setLatestMessage: (msg) => set({ latestMessage: msg }),
}));
