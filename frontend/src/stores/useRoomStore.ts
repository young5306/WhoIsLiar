import { create } from 'zustand';

interface RoomStoreState {
  roomCode: string | null;
  setRoomCode: (id: string) => void;
  clearRoomCode: () => void;
}

export const useRoomStore = create<RoomStoreState>((set) => ({
  roomCode: null,
  setRoomCode: (roomCode: string) => set({ roomCode: roomCode }),
  clearRoomCode: () => set({ roomCode: null }),
}));
