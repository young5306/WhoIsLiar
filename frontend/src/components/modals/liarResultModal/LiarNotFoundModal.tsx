import { useEffect, useRef } from 'react';
import Timer, { TimerRef } from '../../common/Timer';

interface Props {
  roundNumber: number;
  totalRoundNumber: number;
  liarNickName: string;
  onNext: () => void; // 다음 로직
}

const LiarNotFoundModal = ({
  roundNumber,
  totalRoundNumber,
  liarNickName,
  onNext,
}: Props) => {
  const modalTimerRef = useRef<TimerRef>(null);

  useEffect(() => {
    modalTimerRef?.current?.startTimer(3);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70">
      <div className="relative bg-gray-900 border-1 border-primary-600 p-13 rounded-lg text-center text-gray-0">
        {modalTimerRef && (
          <div className="absolute top-6 right-6">
            <Timer ref={modalTimerRef} size="medium" onTimeEnd={onNext} />
          </div>
        )}

        <p className="headline-xlarge mb-2">
          ROUND {roundNumber}/{totalRoundNumber}
        </p>
        <div className="flex flex-col gap-3">
          <div className="text-primary-600 display-medium flex items-center justify-center gap-2 mt-5">
            <img src="assets/mask_smile.png" className="w-15 h-16 pt-1" />
            LIAR NOT FOUND!
          </div>
          <div className="text-primary-600 display-small">
            LIAR : {liarNickName}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiarNotFoundModal;
