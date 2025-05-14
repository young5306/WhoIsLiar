import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import GameButton2 from '../../common/GameButton2';
import Timer, { TimerRef } from '../../common/Timer';

interface Props {
  roundNumber: number;
  totalRoundNumber: number;
  liarNickname?: string;
  onNext: (word: string) => void; // 다음 로직
  onClose: () => void; // 모달 외부 클릭 시 모달 닫힘(테스트용)
}

const LiarFoundModal = ({
  roundNumber,
  totalRoundNumber,
  liarNickname,
  onNext,
  onClose,
}: Props) => {
  const { userInfo } = useAuthStore();
  const [input, setInput] = useState('');

  const isLiar = userInfo?.nickname === liarNickname;

  const modalTimerRef = useRef<TimerRef>(null);

  useEffect(() => {
    modalTimerRef?.current?.startTimer(20);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70"
      onClick={onClose}
    >
      <div
        className="relative bg-gray-900 border-1 border-primary-600 p-13 rounded-lg text-center text-gray-0"
        onClick={(e) => e.stopPropagation()}
      >
        {modalTimerRef && (
          <div className="absolute top-6 right-6">
            <Timer
              ref={modalTimerRef}
              size="medium"
              onTimeEnd={() => onNext(input.trim())}
            />
          </div>
        )}

        <p className="headline-xlarge mb-2">
          ROUND {roundNumber}/{totalRoundNumber}
        </p>
        <div className="flex flex-col items-center gap-3">
          <div className="text-primary-600 display-medium flex items-center justify-center gap-2 mt-5">
            <img src="assets/mask-fill.png" className="w-13 h-14 pt-1" />
            LIAR FOUND!
          </div>
          <div className="display-medium text-primary-600">{liarNickname}</div>
          {isLiar && (
            <>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="한글로 입력해주세요."
                className="px-3 py-3 mt-6 w-[98%] rounded border outline-none border-primary-600 bg-gray-900 text-gray-0 headline-medium placeholder-gray-0/60 focus:ring-2 focus:ring-primary-600/60"
              />
              <GameButton2 text="제출" onClick={() => onNext(input.trim())} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiarFoundModal;
