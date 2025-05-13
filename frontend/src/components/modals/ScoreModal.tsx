import { ScoreResponse } from '../../services/api/GameService';

interface ScoreModalProps {
  type: 'liar-win' | 'civilian-win' | 'final-score';
  roundNumber: number;
  totalRoundNumber: number;
  scores: ScoreResponse['scores'];
  onClose?: () => void;
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
  onClose,
}: ScoreModalProps) => {
  const titleImage = titleImageMap[type];

  const sortedScores = [...scores].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60"
      onClick={onClose}
    >
      <div
        className="relative bg-gray-900 rounded-xl p-10 pb-18 w-[900px] text-center text-gray-0 border-1 border-primary-600"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="headline-xlarge">
          ROUND {roundNumber}/{totalRoundNumber}
        </p>

        <img src={titleImage} alt="title" className="mx-auto mt-8 mb-10 h-18" />

        <ul className="space-y-2">
          {sortedScores.map((s, idx) => (
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
