import { useEffect, useRef } from 'react';
import Timer, { TimerRef } from '../../common/Timer';

interface SkipModalProps {
  skipCount: number;
  roundNumber: number;
  totalRoundNumber: number;
  onNext: () => void; // 다음 로직
}

const SkipModal = ({
  skipCount,
  roundNumber,
  totalRoundNumber,
  onNext,
}: SkipModalProps) => {
  const modalTimerRef = useRef<TimerRef>(null);

  useEffect(() => {
    modalTimerRef?.current?.startTimer(3);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70">
      <div className="relative bg-gray-900 border-1 border-primary-600 py-10 px-23 rounded-lg text-center text-gray-0">
        {modalTimerRef && (
          <div className="absolute top-4 right-4">
            <Timer ref={modalTimerRef} size="small" onTimeEnd={onNext} />
          </div>
        )}

        <p className="headline-xlarge mb-2">
          ROUND {roundNumber}/{totalRoundNumber}
        </p>
        <div className="flex flex-col items-center gap-3 mt-5">
          <div className="text-primary-600 display-medium flex items-center justify-center gap-2">
            <img src="assets/mask_smile.webp" className="w-15 h-16 pt-1" />
            SKIP
          </div>
          {skipCount > 0 ? (
            <div className="headline-xlarge text-primary-600 mt-3">
              Skip Votes: {skipCount}
            </div>
          ) : (
            <div className="headline-xlarge text-primary-600 mt-3">
              플레이어간 동률로 투표가 무효화되었습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkipModal;
