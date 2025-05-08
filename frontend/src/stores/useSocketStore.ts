import { create } from 'zustand';
interface ChatMessage {
  sender: string;
  content: string;
  chatType: string;
}

interface SocketStore {
  subscription: any;
  setSubscription: (subscription: any) => void;
  clearSubscription: () => void;
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
}

const useSocketStore = create<SocketStore>((set) => ({
  subscription: null,
  setSubscription: (subscription) => set({ subscription }),
  clearSubscription: () => set({ subscription: null }),
  chatMessages: [],
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
  clearChatMessages: () => set({ chatMessages: [] }),
}));

export default useSocketStore;
