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
  emotionSubscription: any;
  setEmotionSubscription: (subscription: any) => void;
  clearEmotionSubscription: () => void;
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
}

const useSocketStore = create<SocketStore>((set) => ({
  subscription: null,
  setSubscription: (subscription) => set({ subscription }),
  clearSubscription: () => set({ subscription: null }),
  emotionSubscription: null,
  setEmotionSubscription: (subscription) =>
    set((state) => {
      if (state.emotionSubscription) {
        state.emotionSubscription.unsubscribe();
      }
      return { emotionSubscription: subscription };
    }),
  clearEmotionSubscription: () =>
    set((state) => {
      if (state.emotionSubscription) {
        state.emotionSubscription.unsubscribe();
      }
      return { emotionSubscription: null };
    }),
  chatMessages: [],
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
  clearChatMessages: () => set({ chatMessages: [] }),
}));

export default useSocketStore;
