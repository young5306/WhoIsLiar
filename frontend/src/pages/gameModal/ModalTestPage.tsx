import { useState } from 'react';
import GameButton from '../../components/common/GameButton';
import LiarResultModal from '../../components/modals/LiarResultModal';
import ScoreModal from '../../components/modals/ScoreModal';

const ModalTestPage = () => {
  const [openModal, setOpenModal] = useState<string | null>(null);

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-2xl font-bold mb-4">모달 테스트 페이지</h1>

      <div className="flex flex-wrap gap-4">
        <GameButton
          text="Liar Modal"
          onClick={() => setOpenModal('liar-found')}
        />
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
      </div>

      {openModal === 'liar-found' && (
        <LiarResultModal onClose={() => setOpenModal(null)} />
      )}

      {openModal === 'liar-win' && (
        <ScoreModal type="liar-win" onClose={() => setOpenModal(null)} />
      )}

      {openModal === 'civilian-win' && (
        <ScoreModal type="civilian-win" onClose={() => setOpenModal(null)} />
      )}

      {openModal === 'final-score' && (
        <ScoreModal type="final-score" onClose={() => setOpenModal(null)} />
      )}
    </div>
  );
};

export default ModalTestPage;
