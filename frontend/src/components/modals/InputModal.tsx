import { useState } from 'react';
import GameButton2 from '../common/GameButton2';
import { notify } from '../common/Toast';

interface Props {
  title: string; // 모달 제목
  placeholder: string; // 입력창 placeholder
  onSubmit: (value: string) => void;
  onClose: () => void;
  numeric?: boolean; // 비밀번호 입력 모달 전용
}

const InputModal = ({
  title,
  placeholder,
  onSubmit,
  onClose,
  numeric = false,
}: Props) => {
  const [value, setValue] = useState('');

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      return notify({ type: 'warning', text: '값을 입력해 주세요.' });
    }
    if (numeric && !/^\d{4}$/.test(trimmed)) {
      notify({ type: 'warning', text: '비밀번호는 4자리 숫자여야 합니다.' });
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60"
      onClick={onClose}
    >
      <div
        className="relative bg-gray-900 rounded-xl p-8 w-[92%] max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="headline-large text-primary-600 mb-6 text-center">
          {title}
        </h2>

        <input
          value={value}
          type={numeric ? 'password' : 'text'}
          inputMode={numeric ? 'numeric' : undefined}
          pattern={numeric ? '\\d{4}' : undefined}
          maxLength={numeric ? 4 : undefined}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full h-[70px] headline-medium px-3 mb-8 rounded-lg bg-gray-0/20 outline-none placeholder-gray-300 text-gray-0
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
