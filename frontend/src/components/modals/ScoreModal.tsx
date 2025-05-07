import { useEffect, useState } from 'react';
// import { getRoomScores } from '../../services/api/RoomService';
import { ScoreResponse } from '../../services/api/RoomService';
import { useRoomStore } from '../../stores/useRoomStore';
// import { notify } from '../common/Toast';

interface ScoreModalProps {
  type: 'liar-win' | 'civilian-win' | 'final-score';
  onClose?: () => void;
}

const titleImageMap = {
  'liar-win': 'assets/liar-win.png',
  'civilian-win': 'assets/civilian-win.png',
  'final-score': 'assets/final-score.png',
};

const medalIcons = ['assets/1st.png', 'assets/2nd.png', 'assets/3rd.png'];

const ScoreModal = ({ type, onClose }: ScoreModalProps) => {
  const { roomCode } = useRoomStore();
  const [scoreData, setScoreData] = useState<ScoreResponse | null>(null);

  useEffect(() => {
    // const fetchScores = async () => {
    //   try {
    //     const res = await getRoomScores(roomCode!);
    //     setScores(res.scores);
    //   } catch (err) {
    //     notify({ type: 'error', text: '점수 조회 실패' });
    //   }
    // };
    // fetchScores();

    const dummyResponse: ScoreResponse = {
      roomCode: 'abc123',
      roundNumber: 3,
      scores: [
        { nickname: 'user_01', totalScore: 45 },
        { nickname: 'user_02', totalScore: 30 },
        { nickname: 'user_03', totalScore: 20 },
        { nickname: 'user_04', totalScore: 45 },
        { nickname: 'user_05', totalScore: 30 },
        { nickname: 'user_06', totalScore: 20 },
      ],
    };
    setScoreData(dummyResponse);
  }, [roomCode]);

  const titleImage = titleImageMap[type];
  const roundNumber = scoreData?.roundNumber;
  const scores = scoreData?.scores || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60"
      onClick={onClose}
    >
      <div
        className="relative bg-gray-900 rounded-xl p-10 pb-18 w-[900px] text-center text-gray-0 border-1 border-primary-600"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src="assets/timer.png"
          alt="timer"
          className="absolute top-4 right-4 w-12 h-12"
        />

        {roundNumber && (
          <p className="headline-xlarge">ROUND {roundNumber}/5</p> // /총 라운드 수
        )}

        <img src={titleImage} alt="title" className="mx-auto mt-8 mb-10 h-18" />

        <ul className="space-y-2">
          {scores.map((s, idx) => (
            <li key={s.nickname} className="flex items-center gap-2">
              {/* 메달 아이콘 영역 */}
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
                  <span>{s.nickname}</span>
                </div>
                <span>{s.totalScore}점</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ScoreModal;
