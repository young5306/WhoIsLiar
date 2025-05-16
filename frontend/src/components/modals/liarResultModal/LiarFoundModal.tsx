import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import GameButton2 from '../../common/GameButton2';
import Timer, { TimerRef } from '../../common/Timer';
import { notify } from '../../common/Toast';

interface Props {
  roundNumber: number;
  totalRoundNumber: number;
  liarNickname?: string;
  onNext: (word: string) => void; // 다음 로직
}

const LiarFoundModal = ({
  roundNumber,
  totalRoundNumber,
  liarNickname,
  onNext,
}: Props) => {
  const { userInfo } = useAuthStore();
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLiar = userInfo?.nickname === liarNickname;

  const modalTimerRef = useRef<TimerRef>(null);

  useEffect(() => {
    modalTimerRef?.current?.startTimer(20);
  }, []);

  const handleSubmit = () => {
    if (isSubmitting) return; // 중복 방지

    if (input.trim() === '') {
      notify({
        type: 'warning',
        text: '제시어를 입력해주세요!',
      });
      return;
    }

    setIsSubmitting(true);
    onNext(input.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70">
      <div className="relative bg-gray-900 border-1 border-primary-600 p-13 rounded-lg text-center text-gray-0">
        {modalTimerRef && (
          <div className="absolute top-6 right-6">
            <Timer
              ref={modalTimerRef}
              size="small"
              onTimeEnd={() => onNext(input.trim())}
            />
          </div>
        )}

        <p className="headline-xlarge mb-2">
          ROUND {roundNumber}/{totalRoundNumber}
        </p>
        <div className="flex flex-col items-center gap-3">
          <div className="text-primary-600 display-medium flex items-center justify-center gap-2 mt-5">
            <img src="assets/mask-fill.png" className="w-13 h-14 pt-1" />
            LIAR FOUND!
          </div>
          <div className="display-medium text-primary-600">{liarNickname}</div>
          {isLiar && (
            <>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="정답을 입력해주세요."
                className="px-3 py-3 mt-6 w-[98%] rounded border outline-none border-primary-600 bg-gray-900 text-gray-0 headline-medium placeholder-gray-0/60 focus:ring-2 focus:ring-primary-600/60"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <GameButton2
                text="제출"
                onClick={handleSubmit}
                disabled={isSubmitting}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiarFoundModal;
