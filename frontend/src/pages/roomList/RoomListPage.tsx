import { useEffect, useState } from 'react';
import GameButton from '../../components/common/GameButton';
import { useNavigate } from 'react-router-dom';
import RoomCreateModal from '../../components/modals/RoomCreateModal';
import {
  getRoomList,
  joinRoomByCode,
  joinRoomByPassword,
  RoomSummary,
} from '../../services/api/RoomService';
import { useRoomStore } from '../../stores/useRoomStore';
import { notify } from '../../components/common/Toast';
import InputModal from '../../components/modals/InputModal';

const RoomListPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);

  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRoomCode, setSelectedRoomCode] = useState<string>(''); // 비밀방 roomCode

  const { setRoomCode } = useRoomStore();
  const navigate = useNavigate();

  const fetchRooms = async (roomName?: string) => {
    try {
      const rooms = await getRoomList(roomName);
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

  // 공통 대기방 이동
  const goToWaitingRoom = (roomCode: string) => {
    setRoomCode(roomCode);
    navigate(`/waiting-room?roomCode=${roomCode}`);
  };

  // 코드 입장
  const tryJoinRoomByCode = async (roomCode: string) => {
    try {
      await joinRoomByCode(roomCode);
      goToWaitingRoom(roomCode);
    } catch (err: any) {
      const st = err?.response?.status;
      if (st === 404)
        notify({ type: 'error', text: '유효하지 않은 방 코드입니다.' });
      else if (st === 423)
        notify({ type: 'error', text: '게임이 진행 중인 방입니다.' });
      else if (st === 409)
        notify({ type: 'error', text: '정원이 가득 찬 방입니다.' });
      else
        notify({
          type: 'error',
          text: '코드 입장 중 오류가 발생했습니다.',
        });
    }
  };
  const handleSubmitCode = async (roomCode: string) => {
    await tryJoinRoomByCode(roomCode);
    setIsCodeModalOpen(false);
  };

  // 비밀번호 모달
  const handleJoinRoom = (room: RoomSummary) => {
    if (room.isSecret) {
      // 비밀방 ⇒ roomCode 기억 + 비밀번호 모달 오픈
      setSelectedRoomCode(room.roomCode);
      setIsPasswordModalOpen(true);
    } else {
      tryJoinRoomByCode(room.roomCode);
    }
  };

  // 비밀번호 입장
  const handleSubmitPassword = async (roomCode: string, password: string) => {
    try {
      await joinRoomByPassword(roomCode, password);
      goToWaitingRoom(roomCode);
    } catch (err: any) {
      const st = err?.response?.status;
      if (st === 404) notify({ type: 'error', text: '비밀번호가 틀렸습니다.' });
      else if (st === 423)
        notify({ type: 'error', text: '게임이 진행 중인 방입니다.' });
      else if (st === 409)
        notify({ type: 'error', text: '정원이 가득 찬 방입니다.' });
      else
        notify({
          type: 'error',
          text: '비밀번호 확인 중 오류가 발생했습니다.',
        });
    } finally {
      setIsPasswordModalOpen(false);
    }
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
                    onClick={() => handleJoinRoom(room)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-6 gap-6">
        <GameButton
          text="코드 입장"
          size="medium"
          onClick={() => setIsCodeModalOpen(true)}
        />

        {/* 코드 입력 모달 */}
        {isCodeModalOpen && (
          <InputModal
            title="방 코드 입력"
            placeholder="방 코드를 입력하세요"
            onSubmit={handleSubmitCode}
            onClose={() => setIsCodeModalOpen(false)}
          />
        )}

        {/* 비밀번호 입력 모달 */}
        {isPasswordModalOpen && (
          <InputModal
            title="비밀번호 입력"
            placeholder="비밀번호를 입력하세요"
            onSubmit={(pwd) => handleSubmitPassword(selectedRoomCode, pwd)}
            onClose={() => setIsPasswordModalOpen(false)}
          />
        )}

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
