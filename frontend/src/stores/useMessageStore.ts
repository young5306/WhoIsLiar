import { create } from 'zustand';

type LeaveMessageState = {
  leaveMessageOn: boolean;
  setLeaveMessageOn: (value: boolean) => void;
};

export const useMessageStore = create<LeaveMessageState>((set) => ({
  leaveMessageOn: false,
  setLeaveMessageOn: (value) => set({ leaveMessageOn: value }),
}));
