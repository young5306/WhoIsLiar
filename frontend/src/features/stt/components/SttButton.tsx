import React from 'react';
import { useSttContext } from '../context/SttProvider';

export const SttButton: React.FC = () => {
  const { listening, start, stop } = useSttContext();

  return (
    <button onClick={listening ? stop : start}>
      {listening ? '음성 인식 중지' : '음성 인식 시작'}
    </button>
  );
};
