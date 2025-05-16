import { useEffect, useRef } from 'react';
import { ScoreResponse } from '../../services/api/GameService';
import Timer, { TimerRef } from '../common/Timer';

interface ScoreModalProps {
  type: 'liar-win' | 'civilian-win' | 'final-score';
  roundNumber: number;
  totalRoundNumber: number;
  scores: ScoreResponse['scores']; // 누적 점수
  roundScores?: ScoreResponse['scores']; // 라운드 점수
  onNext: () => void;
}

const titleImageMap = {
  'liar-win': 'assets/liar-win.png',
  'civilian-win': 'assets/civilian-win.png',
  'final-score': 'assets/final-score.png',
};

const medalIcons = ['assets/1st.png', 'assets/2nd.png', 'assets/3rd.png'];

const ScoreModal = ({
  type,
  roundNumber,
  totalRoundNumber,
  scores,
  roundScores = [],
  onNext,
}: ScoreModalProps) => {
  const titleImage = titleImageMap[type];
  const modalTimerRef = useRef<TimerRef>(null);

  useEffect(() => {
    modalTimerRef?.current?.startTimer(10);
  }, []);

  const getRoundScore = (nickname: string) => {
    const found = roundScores.find((r) => r.participantNickname === nickname);
    return found?.score ?? 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60">
      <div className="relative bg-gray-900 rounded-xl p-10 pb-18 w-[900px] text-center text-gray-0 border-1 border-primary-600">
        {/* 타이머를 모달 내부 오른쪽 상단에 표시 */}
        {modalTimerRef && (
          <div className="absolute top-6 right-6">
            <Timer ref={modalTimerRef} size="small" onTimeEnd={onNext} />
          </div>
        )}

        <p className="headline-xlarge">
          ROUND {roundNumber}/{totalRoundNumber}
        </p>

        <img src={titleImage} alt="title" className="mx-auto mt-8 mb-10 h-18" />

        <ul className="space-y-2">
          {scores.map((s, idx) => (
            <li key={s.participantNickname} className="flex items-center gap-2">
              <div className="w-6 flex justify-center">
                {idx < 3 && (
                  <img
                    src={medalIcons[idx]}
                    alt={`${idx + 1}등`}
                    className="w-5 h-6"
                  />
                )}
              </div>

              <div className="flex flex-1 justify-between items-center bg-gray-800 rounded px-5 py-2">
                <div className="flex items-center gap-2">
                  <img
                    src="assets/score-tag.png"
                    alt="player-icon"
                    className="w-5 h-5 mr-1"
                  />
                  <span>{s.participantNickname}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {/* 라운드 점수 표시 */}
                  {getRoundScore(s.participantNickname) !== 0 && (
                    <span className="text-yellow-200 animate-fade-up">
                      {getRoundScore(s.participantNickname) > 0
                        ? `+${getRoundScore(s.participantNickname)}점`
                        : `${getRoundScore(s.participantNickname)}점`}
                    </span>
                  )}
                  {/* 누적 점수 표시 */}
                  <span className="text-gray-0">{s.score}점</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ScoreModal;
