import { useState } from 'react';
import GameButton from '../../components/common/GameButton';
import ScoreModal from '../../components/modals/ScoreModal';
import VoteResultModal from '../../components/modals/VoteResultModal';
import { VoteResultResponse } from '../../services/api/GameService';
import LiarFoundModal from '../../components/modals/liarResultModal/LiarFoundModal';
import LiarNotFoundModal from '../../components/modals/liarResultModal/LiarNotFoundModal';
import SkipModal from '../../components/modals/liarResultModal/SkipModal';

const dummyVoteResult: VoteResultResponse = {
  results: [
    { targetNickname: 'user_01', voteCount: 1 },
    { targetNickname: 'user_02', voteCount: 2 },
    { targetNickname: 'user_03', voteCount: 3 },
    { targetNickname: '', voteCount: 1 },
  ],
  selected: 'user_03',
  detected: true,
  liarNickname: 'user_03',
  liarId: 5,
  skip: false,
};

const dummyScores = [
  { participantNickname: 'user_01', totalScore: 45 },
  { participantNickname: 'user_02', totalScore: 30 },
  { participantNickname: 'user_03', totalScore: 20 },
  { participantNickname: 'user_04', totalScore: 45 },
  { participantNickname: 'user_05', totalScore: 30 },
  { participantNickname: 'user_06', totalScore: 20 },
];

const ModalTestPage = () => {
  const [openModal, setOpenModal] = useState<string | null>(null);

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-2xl font-bold mb-4">모달 테스트 페이지</h1>
      <div className="flex flex-wrap gap-4">
        <GameButton
          text="Vote Result Modal"
          onClick={() => setOpenModal('vote')}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        NEW
        <GameButton
          text="Liar Found Modal"
          onClick={() => setOpenModal('new-liar-found')}
        />
        <GameButton
          text="Liar Not Found Modal"
          onClick={() => setOpenModal('new-liar-not-found')}
        />
        <GameButton
          text="Skip Modal"
          onClick={() => setOpenModal('new-skip')}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <GameButton
          text="Liar Win Modal"
          onClick={() => setOpenModal('liar-win')}
        />
        <GameButton
          text="Civilian Win Modal"
          onClick={() => setOpenModal('civilian-win')}
        />
        <GameButton
          text="Final Score Modal"
          onClick={() => setOpenModal('final-score')}
        />
        <GameButton
          text="Vote Result Modal"
          onClick={() => setOpenModal('vote')}
        />
      </div>

      {openModal === 'vote' && (
        <VoteResultModal
          roundNumber={2}
          totalRoundNumber={3}
          result={dummyVoteResult}
          onNext={() => setOpenModal(null)}
        />
      )}

      {/* NEW */}

      {openModal === 'new-liar-found' && (
        <LiarFoundModal
          roundNumber={2}
          totalRoundNumber={3}
          liarNickname="홍길동"
          onNext={() => setOpenModal(null)}
        />
      )}

      {openModal === 'new-liar-not-found' && (
        <LiarNotFoundModal
          roundNumber={2}
          totalRoundNumber={3}
          liarNickname="홍길동"
          onNext={() => setOpenModal(null)}
        />
      )}

      {openModal === 'new-skip' && (
        <SkipModal
          roundNumber={2}
          totalRoundNumber={3}
          skipCount={3}
          onNext={() => setOpenModal(null)}
        />
      )}

      {openModal === 'liar-win' && (
        <ScoreModal
          type="liar-win"
          scores={dummyScores}
          roundNumber={2}
          totalRoundNumber={5}
          onNext={() => setOpenModal(null)}
        />
      )}
      {openModal === 'civilian-win' && (
        <ScoreModal
          type="civilian-win"
          scores={dummyScores}
          roundNumber={2}
          totalRoundNumber={5}
          onNext={() => setOpenModal(null)}
        />
      )}
      {openModal === 'final-score' && (
        <ScoreModal
          type="final-score"
          scores={dummyScores}
          roundNumber={5}
          totalRoundNumber={5}
          onNext={() => setOpenModal(null)}
        />
      )}
    </div>
  );
};

export default ModalTestPage;
