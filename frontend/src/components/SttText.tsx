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
    <>
      <div className="w-[190px]"></div>
      <div className="max-h-[170px] min-h-[160px] w-[168px] min-w-[168px] rounded-xl p-1 bg-[#320000] text-red-600 flex justify-center">
        <div className="mt-2 w-full">
          <div className="w-full max-h-[76px] min-h-[76px] min-w-[142px] rounded-xl p-1 bg-white border">
            <div className="w-full max-h-[64px] rounded-xl p-1 bg-white overflow-y-auto">
              <div
                className={`text-[10px] ${isHint ? 'text-yellow-300' : isFinal ? 'text-green-300' : 'text-blue-300'}`}
              >
                {isHint && <span className="mr-1">💡</span>}
                {!isHint && isFinal && <span className="mr-1">✓</span>}
                {!isHint && !isFinal && <span className="mr-1">🎤</span>}
                {displayText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SttText;
