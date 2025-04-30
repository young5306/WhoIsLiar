import { useState } from 'react';
import GameButton from '../../components/common/GameButton';
import { RoomCreateModal } from '../../components/modals/RoomCreateModal';

export const RoomListPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenModal = () => setIsCreateModalOpen(true);
  const handleCloseModal = () => setIsCreateModalOpen(false);

  return (
    <div className="">
      <div className="">
        <GameButton text="방 만들기" onClick={handleOpenModal} />
        {/* 모달 */}
        {isCreateModalOpen && <RoomCreateModal onClose={handleCloseModal} />}
      </div>
    </div>
  );
};
