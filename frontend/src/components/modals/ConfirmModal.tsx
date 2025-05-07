import React from 'react';
import GameButton from '../common/GameButton';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 w-96 border border-gray-700/50">
        <h2 className="text-white text-xl font-bold mb-4">{title}</h2>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <GameButton text="취소" size="small" onClick={onClose} />
          <GameButton text="확인" size="small" onClick={onConfirm} />
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
