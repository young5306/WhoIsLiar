import React, { useEffect, useState } from 'react';
import { SttResult } from '../services/api/SttService';

interface SttTextProps {
  sttResult: SttResult | null;
  speaker: string;
}

const SttText: React.FC<SttTextProps> = ({ sttResult }) => {
  const [displayText, setDisplayText] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    if (sttResult) {
      setDisplayText(sttResult.text);
      setIsVisible(true);

      // 3초 후에 텍스트를 숨김
    }
  }, [sttResult]);

  if (!isVisible) return null;

  return (
    <div className="absolute top-0 left-0 right-0 p-2 bg-black bg-opacity-70 text-white text-center z-50">
      <span className="text-sm">{displayText}</span>
    </div>
  );
};

export default SttText;
