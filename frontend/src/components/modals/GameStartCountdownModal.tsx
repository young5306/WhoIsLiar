import { useState, useEffect } from 'react';

interface GameStartCountdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameMode: string;
  videoMode: string;
  category: string;
  totalRounds: number;
}

const GameStartCountdownModal = ({
  isOpen,
  onClose,
  gameMode,
  videoMode,
  category,
  totalRounds,
}: GameStartCountdownModalProps) => {
  // const [countdown, setCountdown] = useState(5);
  const [countdown, setCountdown] = useState(10);

  // 첫 마운트 시에만 실행되는 효과
  useEffect(() => {
    if (!isOpen) return;

    // console.log('카운트다운 시작! 초기값:', 5);
    console.log('카운트다운 시작! 초기값:', 10);

    // 시작 시 값 설정
    // setCountdown(5);
    setCountdown(5);

    // 매 초마다 카운트다운 감소
    const timer = setInterval(() => {
      setCountdown((prevCount) => {
        const nextCount = prevCount - 1;
        console.log('카운트다운 변경:', prevCount, '->', nextCount);
        return nextCount;
      });
    }, 1000);

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      console.log('타이머 정리');
      clearInterval(timer);
    };
  }, [isOpen]);

  // 카운트다운이 0 이하가 되면 게임 시작
  useEffect(() => {
    if (countdown <= 0 && isOpen) {
      console.log('카운트다운 끝! (0이 되어 게임 시작)');
      // 0.5초 후에 onClose 호출하여 게임 시작 (0이 잠깐 보이도록)
      const startGameTimer = setTimeout(() => {
        console.log('게임 시작 함수 호출!');
        onClose();
      }, 500);

      return () => clearTimeout(startGameTimer);
    }
  }, [countdown, onClose, isOpen]);

  if (!isOpen) return null;

  // 프로그레스바 너비 계산 (0~5초)
  const progressWidth = `${Math.max(0, Math.min(100, (countdown / 5) * 100))}%`;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800 text-white p-6 rounded-xl max-w-sm w-full text-center shadow-2xl border-2 border-point-neon">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-point-neon to-transparent">
          <div
            className="h-full bg-point-neon"
            style={{
              width: progressWidth,
              transition: 'width 1s linear',
            }}
          />
        </div>

        <h2 className="text-2xl font-bold mb-4 text-point-neon">
          게임 시작 준비!
        </h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600">
            <p className="text-xs text-gray-300">게임 모드</p>
            <p className="text-base font-bold leading-tight">
              {gameMode === 'DEFAULT' ? '일반 모드' : '바보 모드'}
            </p>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600">
            <p className="text-xs text-gray-300">화면 모드</p>
            <p className="text-base font-bold leading-tight">
              {videoMode === 'VIDEO' ? '비디오 모드' : '블라인드 모드'}
            </p>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600">
            <p className="text-xs text-gray-300">카테고리</p>
            <p className="text-base font-bold leading-tight">{category}</p>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600">
            <p className="text-xs text-gray-300">총 라운드</p>
            <p className="text-base font-bold leading-tight">
              {totalRounds}라운드
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-sm mb-1 text-gray-300">게임 시작까지</p>
          <div className="text-6xl font-bold text-point-neon mb-4">
            {countdown < 0 ? 0 : countdown}
          </div>
          <div className="flex flex-col gap-1.5 text-xs text-gray-300 bg-gray-900 p-3 rounded">
            {videoMode === 'DEFAULT' ? (
              <p>
                ✓ <span className="text-point-neon">마이크</span>와{' '}
                <span className="text-point-neon">카메라</span>를 준비해주세요!
              </p>
            ) : (
              <p>
                ✓ <span className="text-point-neon">마이크</span>와{' '}
                <span className="text-point-neon">채팅창</span>을 통해
                토론하세요!
              </p>
            )}
            <p>✓ 라이어는 제시어를 모르지만 모르는 척 연기해야 합니다</p>
            <p>✓ 시민은 대화를 통해 라이어를 찾아내야 합니다</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStartCountdownModal;
