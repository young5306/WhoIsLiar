import { useEffect } from 'react';
import { ScoreResponse } from '../../services/api/GameService';

interface FinalScoreProps {
  scores: ScoreResponse['scores'];
  onNext: () => void;
}

const medalIcons = ['assets/1st.webp', 'assets/2nd.webp', 'assets/3rd.webp'];

const FinalScoreModal = ({ scores, onNext }: FinalScoreProps) => {
  useEffect(() => {
    import('canvas-confetti').then((module) => {
      const confetti = module.default;
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    });

    const timeout = setTimeout(() => {
      onNext();
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  // 상위 3명만 추출
  const topThree = scores.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative flex flex-col items-center bg-black border border-primary-600 rounded-xl pt-3 pb-10 px-10 w-[550px] text-center text-gray-0">
        {/* {modalTimerRef && (
          <div className="absolute top-6 right-6">
            <Timer ref={modalTimerRef} size="small" onTimeEnd={onNext} />
          </div>
        )} */}

        <div className="flex justify-center mb-5">
          <img
            src="assets/final-score.webp"
            alt="FINAL SCORE"
            className="object-contain"
          />
        </div>

        {/* 점수 리스트 */}
        <ul className="space-y-5 w-[300px]">
          {topThree.map((s, idx) => (
            <li
              key={s.participantNickname}
              className="flex items-center justify-between gap-7 px-6"
            >
              {/* 메달 */}
              <img
                src={medalIcons[idx]}
                alt={`${idx + 1}등`}
                className="w-15 h-18"
              />

              {/* 닉네임 */}
              <div className="flex-1 text-lg text-left font-semibold text-white">
                {s.participantNickname}
              </div>

              {/* 점수 */}
              <div className="text-white text-lg font-bold">
                {s.totalScore}점
              </div>
            </li>
          ))}
        </ul>

        {/* 안내 메시지 */}
        <p className="mt-10 text-sm text-gray-300 animate-pulse">
          5초 후 자동으로 닫히고 대기방으로 이동합니다
        </p>
      </div>
    </div>
  );
};

export default FinalScoreModal;
