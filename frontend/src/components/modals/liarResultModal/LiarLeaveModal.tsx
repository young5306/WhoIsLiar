import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LiarLeaveModalProps {
  roundNumber: number;
  totalRoundNumber: number;
  onNext: () => void; // 다음 로직
}

const LiarLeaveModal = ({
  roundNumber,
  totalRoundNumber,
  onNext,
}: LiarLeaveModalProps) => {
  useEffect(() => {
    console.log('LiarLeaveModal onNext 접속');

    const timeout = setTimeout(() => {
      onNext();
    }, 5000); // 3초 후 onNext 실행

    return () => clearTimeout(timeout); // 컴포넌트 언마운트 시 타이머 정리
  }, [onNext]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70">
        <div className="relative bg-gray-900 border-1 border-primary-600 p-13 rounded-lg text-center text-white">
          <div className="absolute top-4 right-6">
            <Loader2 className="text-primary-600 w-10 h-10 animate-spin mt-2" />
          </div>

          <p className="headline-xlarge mb-2">
            ROUND {roundNumber}/{totalRoundNumber}
          </p>
          <div className="flex flex-col gap-3">
            <div className="text-primary-600 display-medium flex items-center justify-center gap-2 mt-5">
              <img src="assets/mask_smile.webp" className="w-15 h-16 pt-1" />
            </div>

            <div className="text-primary-600 display-small mt-3">
              <p className="display-small mb-5">
                LIAR가 퇴장하여 게임을 계속할 수 없습니다.
              </p>
              <p className="text-xl text-gray-300 animate-pulse">
                {roundNumber !== totalRoundNumber
                  ? '잠시후 다음 라운드로 자동 진행됩니다.'
                  : '잠시후 게임이 종료됩니다.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LiarLeaveModal;
