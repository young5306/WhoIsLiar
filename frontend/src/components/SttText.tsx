import React, { useEffect, useState } from 'react';
import { SttResult } from '../services/api/SttService';

interface SttTextProps {
  sttResult: SttResult | null;
  speaker: string;
  hintMessage?: string;
}

const SttText: React.FC<SttTextProps> = ({ sttResult, hintMessage }) => {
  const [displayText, setDisplayText] = useState<string>('');
  const [isHint, setIsHint] = useState<boolean>(false);
  const [isFinal, setIsFinal] = useState<boolean>(false);

  useEffect(() => {
    // HINT messages take precedence over STT results
    if (hintMessage) {
      setDisplayText(hintMessage);
      setIsHint(true);
      setIsFinal(true);
    } else if (sttResult) {
      setDisplayText(sttResult.text);
      setIsHint(false);
      setIsFinal(sttResult.isFinal);
    } else {
      // No text to display
      setDisplayText('');
      setIsHint(false);
      setIsFinal(false);
    }
  }, [sttResult, hintMessage]);

  if (!displayText) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50">
      <div
        className={`bg-black bg-opacity-70 ${
          isHint
            ? 'text-yellow-300 font-medium'
            : isFinal
              ? 'text-green-300'
              : 'text-blue-300'
        } px-3 py-1.5 text-center`}
      >
        <div className="text-xs">
          {isHint && <span className="mr-1">💡</span>}
          {!isHint && isFinal && <span className="mr-1">✓</span>}
          {!isHint && !isFinal && <span className="mr-1">🎤</span>}
          {displayText}
        </div>
      </div>
    </div>
  );
};

export default SttText;
