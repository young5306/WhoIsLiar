import { useEffect, useRef, useState } from 'react';
import {
  VoteResultItem,
  VoteResultResponse,
} from '../../services/api/GameService';
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
  // const [visibleItems, setVisibleItems] = useState<VoteResultItem[]>([]);
  // const [currentIndex, setCurrentIndex] = useState(0);
  const [sortedResults, setSortedResults] = useState<VoteResultItem[]>([]);
  const modalTimerRef = useRef<TimerRef>(null);

  useEffect(() => {
    // 투표 수 오름차순 정렬
    const sorted = [...result.results].sort(
      (a, b) => a.voteCount - b.voteCount
    );
    setSortedResults(sorted);

    modalTimerRef?.current?.startTimer(3);
  }, [result]);

  return (
    <div className="fixed inset-0 bg-gray-900/70 z-50 flex items-center justify-center">
      <div
        className="relative bg-gray-900 border-1 border-primary-600 rounded-xl p-10 pb-14 w-[600px] text-center text-gray-0"
        onClick={(e) => e.stopPropagation()}
      >
        {modalTimerRef && (
          <div className="absolute top-6 right-6">
            <Timer ref={modalTimerRef} size="medium" onTimeEnd={onNext} />
          </div>
        )}

        <p className="headline-xlarge text-gray-0 mb-10">
          ROUND {roundNumber}/{totalRoundNumber}
        </p>

        <div className="flex justify-center items-center gap-4">
          <img
            src="assets/mask-fill.png"
            alt="vote-icon"
            className="w-12 h-12"
          />
          <p className="headline-xlarge text-primary-600">VOTE RESULT</p>
        </div>

        <ul className="space-y-3 mt-5">
          {/* {visibleItems.map((item, idx) => ( */}
          {sortedResults.map((item, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between bg-gray-800 rounded px-6 py-3 headline-medium"
            >
              <span>{item.targetNickname || 'SKIP'}</span>
              <span>{item.voteCount}표</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VoteResultModal;
