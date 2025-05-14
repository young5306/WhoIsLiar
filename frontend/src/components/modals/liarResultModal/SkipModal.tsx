import { useEffect } from 'react';

interface SkipModalProps {
  skipCount: number;
  roundNumber: number;
  totalRoundNumber: number;
  onNext: () => void; // 다음 로직
  onClose: () => void; // 모달 외부 클릭 시 모달 닫힘(테스트용)
}

const SkipModal = ({
  skipCount,
  roundNumber,
  totalRoundNumber,
  onNext,
  onClose,
}: SkipModalProps) => {
  useEffect(() => {
    console.log('onNext: skip 모달 다음 로직 준비');
    const timer = setTimeout(onNext, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border-1 border-primary-600 p-13 rounded-lg text-center text-gray-0"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="headline-xlarge mb-2">
          ROUND {roundNumber}/{totalRoundNumber}
        </p>
        <div className="flex flex-col items-center gap-3 mt-5">
          <div className="text-primary-600 display-medium flex items-center justify-center gap-2">
            <img src="assets/mask_smile.png" className="w-15 h-16 pt-1" />
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
