import { create } from 'zustand';
import { Client as StompClient } from '@stomp/stompjs';

export type SocketMessage = {
  sender: string;
  content: string;
  chatType: string;
};

interface SocketStoreState {
  latestMessage: SocketMessage | null;
  setLatestMessage: (msg: SocketMessage) => void;
  subscription: any | null;
  setSubscription: (sub: any) => void;
  clearSubscription: () => void;
}

export const useSocketStore = create<SocketStoreState>((set) => ({
  latestMessage: null,
  setLatestMessage: (msg) => set({ latestMessage: msg }),
  subscription: null,
  setSubscription: (sub) => set({ subscription: sub }),
  clearSubscription: () => set({ subscription: null }),
}));
