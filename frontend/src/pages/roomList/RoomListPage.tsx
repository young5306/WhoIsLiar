import { useEffect, useState } from 'react';
import GameButton from '../../components/common/GameButton';
import { useNavigate } from 'react-router-dom';
import RoomCreateModal from '../../components/modals/RoomCreateModal';
import { getRoomList, RoomSummary } from '../../services/api/RoomService';
import { useRoomStore } from '../../stores/useRoomStore';

const RoomListPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);
  const handleCodeModal = () => {};

  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [search, setSearch] = useState('');
  const { setRoomCode } = useRoomStore();

  const navigate = useNavigate();

  const fetchRooms = async (roomName?: string) => {
    try {
      const rooms = await getRoomList(roomName);
      console.log('response', rooms);
      setRooms(rooms);
    } catch (err) {
      alert('방 목록을 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleSearch = () => {
    fetchRooms(search);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleEnterRoom = (roomCode: string) => {
    setRoomCode(roomCode);
    navigate(`/waiting-room?roomCode=${roomCode}`);
  };

  return (
    <div className="w-screen h-screen mt-10 p-20 py-10">
      <div className="flex items-end justify-between mb-5">
        <h1 className="display-medium text-gray-0">방 목록</h1>

        {/* 검색창 */}
        <div className="flex gap-2 justify-end">
          <button onClick={handleSearch}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 40 40"
              fill="none"
            >
              <circle
                cx="18.334"
                cy="18.334"
                r="10"
                stroke="white"
                strokeWidth="3"
              />
              <path
                d="M18.334 13.334C17.6774 13.334 17.0272 13.4633 16.4206 13.7146C15.8139 13.9659 15.2627 14.3342 14.7985 14.7985C14.3342 15.2627 13.9659 15.8139 13.7146 16.4206C13.4633 17.0272 13.334 17.6774 13.334 18.334"
                stroke="#2A4157"
                strokeOpacity="0.24"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M33.334 33.334L28.334 28.334"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="방 제목 검색"
            className="headline-medium bg-transparent outline-none border-b border-gray-0 text-gray-0 placeholder-gray-0/20 w-[70%]"
          />
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto ">
        {rooms.map((room, idx) => (
          <div
            key={idx}
            className="border-3 border-transparent hover:border-primary-600 flex items-center justify-between px-4 py-2 my-3 bg-gray-0/20 rounded-lg headline-large w-full"
          >
            <div className="flex items-center w-full text-gray-0">
              <span className="w-20 text-center mr-8">{idx + 1}</span>
              <span className="w-[30%] truncate">{room.roomName}</span>
              <span className="w-[20%] truncate">{room.hostNickname}</span>

              <div className="flex justify-between flex-1 items-center">
                <div className="w-30 flex items-center justify-start">
                  <img src="assets/people-white.svg" className="w-9 mr-2" />
                  <span>{room.playerCount}/6</span>
                </div>
                <span className="w-24 text-center">
                  <span
                    className={`${
                      room.status === 'waiting'
                        ? 'text-point-neon'
                        : 'text-primary-600'
                    }`}
                  >
                    {room.status === 'waiting' ? '대기중' : '게임중'}
                  </span>
                </span>

                <div className="w-12 flex justify-center">
                  {room.isSecret ? (
                    <img src="assets/lock.svg" className="w-9" />
                  ) : (
                    <div className="w-5" />
                  )}
                </div>

                <div className="w-24 flex justify-end">
                  <GameButton
                    text="입장"
                    size="small"
                    onClick={() => handleEnterRoom(room.roomCode)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-6 gap-6">
        <GameButton text="코드 입장" size="medium" onClick={handleCodeModal} />
        <GameButton
          text="방 만들기"
          size="medium"
          onClick={handleOpenCreateModal}
        />
        {isCreateModalOpen && (
          <RoomCreateModal onClose={handleCloseCreateModal} />
        )}
      </div>
    </div>
  );
};

export default RoomListPage;
