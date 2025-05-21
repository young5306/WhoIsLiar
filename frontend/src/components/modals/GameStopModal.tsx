import { useRef, useEffect } from 'react';
import Timer, { TimerRef } from '../common/Timer';

interface GameStopModalProps {
  onNext: () => void; // 다음 로직
}

const GameStopModal = ({ onNext }: GameStopModalProps) => {
  const modalTimerRef = useRef<TimerRef>(null);

  useEffect(() => {
    modalTimerRef?.current?.startTimer(5);
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70">
        <div className="relative bg-gray-900 border-1 border-primary-600 p-13 rounded-lg text-center text-white">
          {modalTimerRef && (
            <div className="absolute top-6 right-6">
              <Timer
                ref={modalTimerRef}
                size="small"
                onTimeEnd={() => onNext()}
              />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="text-primary-600 display-medium flex items-center justify-center gap-2 mt-5">
              <img src="assets/mask_smile.webp" className="w-15 h-16 pt-1" />
            </div>

            <div className="text-primary-600 display-small mt-3">
              <p className="display-small mb-5">
                인원 수가 부족하여 게임을 계속할 수 없습니다.
              </p>
              <p className="text-xl text-gray-300 animate-pulse">
                잠시후 게임이 종료됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GameStopModal;
