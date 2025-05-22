import { useEffect, useRef } from 'react';
import { VoteResultResponse } from '../../services/api/GameService';
import Timer, { TimerRef } from '../common/Timer';

interface Props {
  roundNumber: number;
  totalRoundNumber: number;
  result: VoteResultResponse;
  onNext: () => void; // 다음 로직
}

const VoteResultModal = ({
  roundNumber,
  totalRoundNumber,
  result,
  onNext,
}: Props) => {
  const modalTimerRef = useRef<TimerRef>(null);

  useEffect(() => {
    modalTimerRef?.current?.startTimer(5);
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900/70 z-50 flex items-center justify-center">
      <div className="relative bg-gray-900 border-1 border-primary-600 rounded-xl p-10 pb-14 w-[600px] text-center text-gray-0">
        {modalTimerRef && (
          <div className="absolute top-6 right-6">
            <Timer ref={modalTimerRef} size="small" onTimeEnd={onNext} />
          </div>
        )}

        <p className="headline-xlarge text-gray-0 mb-10">
          ROUND {roundNumber}/{totalRoundNumber}
        </p>

        <div className="flex justify-center items-center gap-4">
          <img
            src="assets/mask-fill.webp"
            alt="vote-icon"
            className="w-12 h-12"
          />
          <p className="headline-xlarge text-primary-600">VOTE RESULT</p>
        </div>

        <ul className="space-y-3 mt-5">
          {result.results.map((item, idx) => {
            const isLast = idx === result.results.length - 1;

            return (
              <li
                key={idx}
                className={`flex items-center justify-between rounded px-6 py-3 headline-medium ${
                  isLast
                    ? 'bg-gray-900 text-gray-500'
                    : 'bg-gray-800 text-gray-0'
                }`}
              >
                <span>{item.targetNickname || 'SKIP'}</span>
                <span>{item.voteCount}표</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default VoteResultModal;
