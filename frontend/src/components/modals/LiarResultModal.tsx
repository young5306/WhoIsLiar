import { useEffect, useState } from 'react';
import { submitWordGuess } from '../../services/api/GameService';
import { useRoomStore } from '../../stores/useRoomStore';
import GameButton2 from '../common/GameButton2';
import { notify } from '../common/Toast';
import { useAuthStore } from '../../stores/useAuthStore';
import useSocketStore from '../../stores/useSocketStore';

interface Props {
  roundNumber: number;
  totalRoundNumber: number;
  result: {
    detected: boolean;
    skip: boolean;
    liarNickname?: string;
  };
  results: {
    targetNickname: string | null;
    voteCount: number;
  }[];
  onClose: () => void;
}

const LiarResultModal = ({
  roundNumber,
  totalRoundNumber,
  result,
  results,
  onClose,
}: Props) => {
  const { roomCode } = useRoomStore();
  const { userInfo } = useAuthStore();

  // 제시어 추측 입력창 (라이어용)
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // ui 추가

  // 제시어 추측 제출 (라이어용)
  const handleSubmit = async () => {
    if (!input.trim()) {
      return notify({ type: 'warning', text: '제시어를 입력하세요.' });
    }

    try {
      setIsSubmitting(true);
      await submitWordGuess(roomCode!, roundNumber, input.trim());
      notify({
        type: 'success',
        text: `제시어 ${input.trim()}(이)가 제출되었습니다!`,
      });

      //////////// 웹소켓 메시지 (임시 코드) ////////////
      useSocketStore.getState().addChatMessage({
        sender: 'SYSTEM',
        content: `라이어가 ${input.trim()}(을)를 제출했습니다`,
        chatType: 'GUESS_SUBMITTED',
      });
      ///////////////////////////////////////////////
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || '제시어 제출에 실패했습니다.';
      notify({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // skip 모달 - skip 수
  const skipCount = results.find((r) => !r.targetNickname)?.voteCount || 0;

  // liar found/ liar not found/ skip 모달 표시
  const renderContent = () => {
    if (result.skip) {
      return (
        <div className="flex flex-col items-center gap-3 mt-5">
          <div className="text-primary-600 display-medium flex items-center justify-center gap-2">
            <img src="assets/mask_smile.png" className="w-15 h-16 pt-1" />
            SKIP
          </div>
          <div className="display-medium text-primary-600">
            Skip Votes: {skipCount}
          </div>
        </div>
      );
    }

    if (result.detected) {
      const isLiar = userInfo?.nickname === result.liarNickname;

      return (
        <div className="flex flex-col items-center gap-3">
          <div className="text-primary-600 display-medium flex items-center justify-center gap-2 mt-5">
            <img src="assets/mask-fill.png" className="w-13 h-14 pt-1" />
            LIAR FOUND!
          </div>
          <div className="display-medium text-primary-600">
            {result.liarNickname}
          </div>
          {isLiar && (
            <>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="라이어 제시어 추측"
                className="px-3 py-3 mt-6 w-[98%] rounded border outline-none border-primary-600 bg-gray-900 text-gray-0 headline-medium placeholder-gray-0/60 focus:ring-2 focus:ring-primary-600/60"
              />
              <GameButton2
                text="제출"
                onClick={handleSubmit}
                // disabled={isSubmitting}
              />
            </>
          )}
        </div>
      );
    }

    return (
      <div className="text-primary-600 display-medium flex items-center justify-center gap-2 mt-5">
        <img src="assets/mask_smile.png" className="w-15 h-16 pt-1" />
        LIAR NOT FOUND!
      </div>
    );
  };

  // skip 모달 - 2초 후 자동 닫기
  useEffect(() => {
    if (result.skip) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [result.skip, onClose]);

  // liar not found 모달 - 5초 후 자동 닫기
  useEffect(() => {
    if (!result.skip && !result.detected) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [result.detected, result.skip, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70">
      <div className="bg-gray-900 border-1 border-primary-600 p-13 rounded-lg text-center text-gray-0">
        <p className="headline-xlarge mb-2">
          ROUND {roundNumber}/{totalRoundNumber}
        </p>
        {renderContent()}
      </div>
    </div>
  );
};

export default LiarResultModal;
