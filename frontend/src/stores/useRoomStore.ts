import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface RoomStoreState {
  roomCode: string | null;
  setRoomCode: (id: string) => void;
  clearRoomCode: () => void;
}

export const useRoomStore = create<RoomStoreState>()(
  persist(
    (set) => ({
      roomCode: null,
      setRoomCode: (roomCode: string) => {
        console.log('Setting roomCode:', roomCode);
        set({ roomCode });
      },
      clearRoomCode: () => {
        console.log('Clearing roomCode');
        set({ roomCode: null });
      },
    }),
    {
      name: 'room-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
