import React from 'react';
import { useSttContext } from '../context/SttProvider';

export const Transcript: React.FC = () => {
  const { transcript } = useSttContext();
  return (
    <div style={{
      whiteSpace: 'pre-wrap',
      padding: '0.5rem',
      border: '1px solid #ddd',
      borderRadius: '4px',
      minHeight: '3rem'
    }}>
      {transcript || <i>인식된 텍스트가 여기에 표시됩니다.</i>}
    </div>
  );
};
