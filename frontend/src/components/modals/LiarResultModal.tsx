// LiarResultModal.tsx
import { useEffect, useState } from 'react';
import {
  submitWordGuess,
  // getVoteResult,
  VoteResultResponse,
} from '../../services/api/RoomService';
import { useRoomStore } from '../../stores/useRoomStore';
import GameButton2 from '../common/GameButton2';
import { notify } from '../common/Toast';

interface Props {
  onClose: () => void;
}

const LiarResultModal = ({ onClose }: Props) => {
  const { roomCode } = useRoomStore();
  const [result, setResult] = useState<VoteResultResponse | null>(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    // const fetchResult = async () => {
    //   try {
    //     const response = await getVoteResult(roomCode!, roundNumber);
    //     setResult(response);
    //   } catch (err) {
    //     notify({ type: 'error', text: '투표결과 조회 실패' });
    //   }
    // };
    // fetchResult();

    // 더미 데이터 사용
    const dummy: VoteResultResponse = {
      roomCode: 'abc123',
      roundNumber: 2,
      results: [
        { targetNickname: 'user_05', voteCount: 3 },
        { targetNickname: 'user_02', voteCount: 2 },
      ],
      selected: 'user_05',
      detected: false,
      liarNickname: 'user_05',
    };
    setResult(dummy);
  }, [roomCode]);

  if (!result) return null;
  const { roundNumber, detected, liarNickname } = result;

  const handleSubmit = async () => {
    if (!input.trim()) {
      return notify({ type: 'warning', text: '제시어를 입력하세요.' });
    }

    try {
      await submitWordGuess(roomCode!, roundNumber, input.trim());
      notify({ type: 'success', text: '제시어가 제출되었습니다!' });
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || '제시어 제출에 실패했습니다.';
      notify({ type: 'error', text: msg });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border-1 border-primary-600 p-13 rounded-lg  text-center text-gray-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* /총 라운드 수*/}
        <p className="headline-xlarge mb-2">ROUND {roundNumber}/5</p>{' '}
        <div className="flex flex-col items-center gap-3">
          <div className="text-primary-600 display-medium flex items-center justify-center gap-2 mt-5">
            <img src="assets/mask-fill.png" className="w-13 h-14 pt-1" />
            {detected ? 'LIAR FOUND!' : 'LIAR NOT FOUND!'}
          </div>
          {detected && (
            <div className="display-medium text-primary-600">
              {liarNickname}
            </div>
          )}
          {detected && (
            <>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="라이어 제시어 추측"
                className="px-3 py-3 mt-6 w-[98%] rounded border outline-none border-primary-600 bg-gray-900 text-gray-0 headline-medium placeholder-gray-0/60 focus:ring-2 focus:ring-primary-600/60"
              />
              <GameButton2 text="제출" onClick={handleSubmit} />
            </>
          )}
          {!detected && (
            <img src="assets/timer.png" className="w-20 h-20 mt-10" />
          )}
        </div>
      </div>
    </div>
  );
};

export default LiarResultModal;
