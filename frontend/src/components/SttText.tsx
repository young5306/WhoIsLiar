import React, { useEffect, useState } from 'react';
import { SttResult } from '../services/api/SttService';

interface SttTextProps {
  sttResult: SttResult | null;
  speaker: string;
}

const SttText: React.FC<SttTextProps> = ({ sttResult }) => {
  const [displayText, setDisplayText] = useState<string>('');

  useEffect(() => {
    if (sttResult) {
      setDisplayText(sttResult.text);
    }
  }, [sttResult]);

  if (!displayText) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50">
      <div className="bg-black bg-opacity-70 text-blue-300 px-3 py-1.5 text-center">
        <div className="text-xs">{displayText}</div>
      </div>
    </div>
  );
};

export default SttText;
