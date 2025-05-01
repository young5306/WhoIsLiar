import { useState } from 'react';
import GameButton2 from '../common/GameButton2';
import { notify } from '../common/Toast';

interface Props {
  title: string; // 모달 제목
  placeholder: string; // 입력창 placeholder
  onSubmit: (value: string) => void;
  onClose: () => void;
}

const InputModal = ({ title, placeholder, onSubmit, onClose }: Props) => {
  const [value, setValue] = useState('');

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      notify({ type: 'warning', text: '값을 입력해 주세요.' });
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60">
      <div className="relative bg-gray-900 rounded-xl p-8 w-[92%] max-w-sm">
        <h2 className="headline-large text-primary-600 mb-6 text-center">
          {title}
        </h2>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 mb-8 rounded-lg bg-gray-800 outline-none placeholder-gray-500 text-gray-0
                     border-3 border-primary-600 focus:ring-2 focus:ring-primary-600/60"
        />

        <div className="flex gap-4">
          <GameButton2 text="취소" onClick={onClose} />
          <GameButton2 text="입장" onClick={handleConfirm} />
        </div>
      </div>
    </div>
  );
};

export default InputModal;
