import { useState } from 'react';
import GameButton from '../../components/common/GameButton';
import ScoreModal from '../../components/modals/ScoreModal';
import VoteResultModal from '../../components/modals/VoteResultModal';
import { VoteResultResponse } from '../../services/api/GameService';
import LiarFoundModal from '../../components/modals/liarResultModal/LiarFoundModal';
import LiarNotFoundModal from '../../components/modals/liarResultModal/LiarNotFoundModal';
import LiarLeaveModal from '../../components/modals/liarResultModal/LiarLeaveModal';
import SkipModal from '../../components/modals/liarResultModal/SkipModal';
import FinalScoreModal from '../../components/modals/FinalScoreModal';

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

const dummyRoundScores = [
  { participantNickname: 'user_01', totalScore: 10 },
  { participantNickname: 'user_02', totalScore: 20 },
  { participantNickname: 'user_03', totalScore: 0 },
  { participantNickname: 'user_04', totalScore: -10 },
  { participantNickname: 'user_05', totalScore: 0 },
  { participantNickname: 'user_06', totalScore: -20 },
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
          text="Liar Leave Modal"
          onClick={() => setOpenModal('new-liar-leave')}
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
        <GameButton
          text="Liar Guess Result Modal"
          onClick={() => setOpenModal('liar-guess-result')}
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

      {openModal === 'new-liar-leave' && (
        <LiarLeaveModal
          roundNumber={3}
          totalRoundNumber={3}
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
          roundScores={dummyRoundScores}
          roundNumber={2}
          totalRoundNumber={5}
          onNext={() => setOpenModal(null)}
        />
      )}
      {openModal === 'civilian-win' && (
        <ScoreModal
          type="civilian-win"
          scores={dummyScores}
          roundScores={dummyRoundScores}
          roundNumber={2}
          totalRoundNumber={5}
          onNext={() => setOpenModal(null)}
        />
      )}
      {openModal === 'final-score' && (
        <FinalScoreModal
          scores={dummyScores}
          onNext={() => setOpenModal(null)}
        />
      )}

      {openModal === 'liar-guess-result' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white border-2 border-primary-600 text-gray-800 p-10 rounded-2xl text-center shadow-2xl max-w-xl w-full mx-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 via-blue-500 to-primary-600"></div>

            {/* isCorrect = true, guessedWord = '청경채', answerWord = '미나리' */}
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 border-2 border-green-500 rounded-full p-6 animate-pulse shadow-lg shadow-green-500/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>
            <p className="display-medium mb-4 text-5xl font-bold text-green-600">
              정답!
            </p>
            <p className="headline-medium mb-6 text-gray-700">
              라이어가 제시어로 제출한 단어는
            </p>
            <div className="bg-gray-100 py-5 px-8 rounded-lg border border-primary-600/30 mb-4">
              <p className="display-small text-4xl font-extrabold text-primary-600 tracking-wider">
                청경채
              </p>
            </div>

            <div className="flex justify-center">
              <div className="mt-4 headline-small text-[#6F2872] ">
                <p className="mb-1">정답 제시어</p>
                <div className="inline-block px-3 py-1 bg-gray-100 border border-gray-300 rounded-full headline-medium font-semibold text-gray-700">
                  미나리
                </div>
              </div>
              <div className="mt-4 headline-small text-[#6F2872] ml-5">
                <p className="mb-1">라이어 제시어</p>
                <div className="inline-block px-3 py-1 bg-gray-100 border border-gray-300 rounded-full headline-medium font-semibold text-gray-700">
                  청경채
                </div>
              </div>
            </div>
            <div className="mt-8 text-sm text-gray-500 animate-pulse">
              결과 화면은 잠시 후 자동으로 닫힙니다...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalTestPage;
