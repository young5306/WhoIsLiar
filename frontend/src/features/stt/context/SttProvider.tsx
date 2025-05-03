import React, { createContext, useContext, ReactNode } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface SttContextType {
  transcript: string;
  listening: boolean;
  start: () => void;
  stop: () => void;
}

const SttContext = createContext<SttContextType | undefined>(undefined);

export const SttProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { transcript, listening, start, stop } = useSpeechRecognition();

  return (
    <SttContext.Provider value={{ transcript, listening, start, stop }}>
      {children}
    </SttContext.Provider>
  );
};

export function useSttContext() {
  const ctx = useContext(SttContext);
  if (!ctx) {
    throw new Error('useSttContext must be used within SttProvider');
  }
  return ctx;
}
