import { useEffect, useState } from 'react';
import {
  VoteResultItem,
  VoteResultResponse,
} from '../../services/api/GameService';

interface Props {
  roundNumber: number;
  totalRoundNumber: number;
  result: VoteResultResponse;
  onClose: () => void;
}

const VoteResultModal = ({
  roundNumber,
  totalRoundNumber,
  result,
  onClose,
}: Props) => {
  const [visibleItems, setVisibleItems] = useState<VoteResultItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortedResults, setSortedResults] = useState<VoteResultItem[]>([]);

  useEffect(() => {
    // 투표 수 오름차순 정렬
    const sorted = [...result.results].sort(
      (a, b) => a.voteCount - b.voteCount
    );
    setSortedResults(sorted);
    setVisibleItems([]); // 초기화
    setCurrentIndex(0);
  }, [result]);

  useEffect(() => {
    if (!sortedResults.length) return;

    const interval = setInterval(() => {
      setVisibleItems((prev) => [...prev, sortedResults[currentIndex]]);
      setCurrentIndex((prev) => prev + 1);
    }, 1000); // 투표 결과 1초마다 하나씩 순차적으로 출력

    if (currentIndex >= sortedResults.length) {
      clearInterval(interval);
      setTimeout(onClose, 3000); // 3초 뒤 다음 로직
    }

    return () => clearInterval(interval);
  }, [currentIndex, sortedResults, onClose]);

  return (
    <div className="fixed inset-0 bg-gray-900/70 z-50 flex items-center justify-center">
      <div
        className="relative bg-gray-900 border-1 border-primary-600 rounded-xl p-10 pb-14 w-[600px] text-center text-gray-0"
        onClick={(e) => e.stopPropagation()}
      >
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
          {visibleItems.map((item, idx) => (
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
