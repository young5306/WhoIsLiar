import { useEffect, useState } from 'react';
import GameButton from '../../components/common/GameButton';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { Crown } from 'lucide-react';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { useAuthStore } from '../../stores/useAuthStore';
import { logoutApi } from '../../services/api/AuthService';
// @ts-ignore
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

const RoomListPage = () => {
  const location = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);

  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRoomCode, setSelectedRoomCode] = useState<string>(''); // 비밀방 roomCode

  const { setRoomCode } = useRoomStore();
  const { userInfo, clearUserInfo } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutApi();
      clearUserInfo();
      navigate('/');
      notify({ type: 'success', text: '로그아웃되었습니다.' });
    } catch (error) {
      notify({ type: 'error', text: '로그아웃 중 오류가 발생했습니다.' });
    }
  };

  const fetchRooms = async (roomName?: string) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const rooms = await getRoomList(roomName);
      setRooms(rooms);
    } catch (err) {
      console.error('방 목록 조회 실패:', err);
      notify({ type: 'error', text: '방 목록을 불러오는데 실패했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadRooms = async () => {
      if (isMounted) {
        await fetchRooms();
      }
    };

    loadRooms();

    // location state에서 shouldRefresh가 true인 경우 방 목록 새로고침
    if (location.state?.shouldRefresh) {
      fetchRooms();
      // state 초기화
      window.history.replaceState({}, document.title);
    }

    return () => {
      isMounted = false;
    };
  }, [location]);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('custom-scrollbar')) {
        document.body.style.cursor = 'none';
      }
    };

    const scrollContainer = document.querySelector('.custom-scrollbar');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      scrollContainer.addEventListener('mouseover', () => {
        document.body.style.cursor = 'none';
      });
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
        scrollContainer.removeEventListener('mouseover', () => {
          document.body.style.cursor = 'none';
        });
      }
    };
  }, []);

  const handleSearch = () => {
    fetchRooms(search);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleRefresh = (e: React.MouseEvent<HTMLButtonElement>) => {
    const img = e.currentTarget.querySelector('img');
    if (!img) return;

    img.classList.add('animate-spin-once-counter');
    setTimeout(() => {
      img.classList.remove('animate-spin-once-counter');
    }, 500);

    fetchRooms(search || undefined);
  };

  // 공통 대기방 이동
  const goToWaitingRoom = (roomCode: string) => {
    setRoomCode(roomCode);
    navigate(`/waiting-room`);
  };

  // 코드 입장
  const tryJoinRoomByCode = async (roomCode: string) => {
    try {
      await joinRoomByCode(roomCode);
      goToWaitingRoom(roomCode);
      setIsCodeModalOpen(false);
    } catch (err: any) {
      const st = err?.response?.status;
      if (st === 404)
        return notify({ type: 'error', text: '유효하지 않은 방 코드입니다.' });
      else if (st === 423)
        return notify({ type: 'error', text: '게임이 진행 중인 방입니다.' });
      else if (st === 409)
        return notify({ type: 'error', text: err?.response?.data?.message });
      else
        return notify({
          type: 'error',
          text: '코드 입장 중 오류가 발생했습니다.',
        });
    }
  };
  const handleSubmitCode = async (roomCode: string) => {
    await tryJoinRoomByCode(roomCode);
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
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      const st = err?.response?.status;
      if (st === 403)
        return notify({ type: 'error', text: '비밀번호가 틀렸습니다.' });
      else if (st === 423)
        return notify({ type: 'error', text: '게임이 진행 중인 방입니다.' });
      else if (st === 409)
        return notify({ type: 'error', text: '정원이 가득 찬 방입니다.' });
      else
        return notify({
          type: 'error',
          text: '비밀번호 확인 중 오류가 발생했습니다.',
        });
    }
  };

  return (
    <div className="w-screen h-screen mt-10 px-40 py-8">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <div className="text-gray-0 headline-medium">
          {userInfo?.nickname}님 안녕하세요!
        </div>
        <GameButton
          text="로그아웃"
          size="small"
          variant="gray"
          onClick={handleLogout}
        />
      </div>

      {/* 룰북 버튼 */}
      <div className="absolute bottom-8 right-8">
        <button
          onClick={() => navigate('/rule-book')}
          className="group bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm p-3 rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-rose-500/20"
          title="게임 규칙 보기"
        >
          <QuestionMarkIcon className="w-7 h-7 text-rose-500 group-hover:scale-110 transition-transform duration-200" />
        </button>
      </div>

      <div className="flex items-end justify-between mb-5">
        <div className="flex items-center gap-2">
          <h1 className="display-small text-gray-0">방 목록</h1>
          {/* 새로고침 아이콘 버튼 */}
          <button onClick={handleRefresh} className="cursor-pointer">
            <img src="/assets/renew.webp" alt="갱신" className="w-10" />
          </button>
        </div>

        {/* 검색창 */}
        <div className="flex gap-2 justify-end">
          <button onClick={handleSearch} className="cursor-pointer">
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
            className="headline-medium py-2 bg-transparent outline-none border-b border-gray-0 text-gray-0 placeholder-gray-0/20 w-[70%]"
          />
        </div>
      </div>

      <SimpleBar className="max-h-[350px]" style={{ cursor: 'none' }}>
        {rooms.length === 0 ? (
          <div className="text-center text-gray-400  headline-medium px-4 py-4 my-3 bg-gray-0/20 rounded-lg">
            아직 생성된 방이 없습니다.
          </div>
        ) : (
          rooms.map((room, idx) => (
            <div
              key={idx}
              className="cursor-default border-2 border-transparent hover:border-primary-600 flex items-center justify-between px-4 py-1 my-3 bg-gray-0/20 rounded-lg headline-medium w-full"
              onDoubleClick={() => handleJoinRoom(room)}
            >
              <div className="flex items-center w-full text-gray-0">
                <span className="w-20 text-center mr-8">{idx + 1}</span>
                <span className="w-[30%] truncate">{room.roomName}</span>
                <div className="w-[20%] flex items-center justify-start">
                  <Crown className="w-9 text-gray-0" />
                  <span className="truncate">{room.hostNickname}</span>
                </div>

                <div className="flex justify-between flex-1 items-center">
                  <div className="w-30 flex items-center justify-start">
                    <img src="assets/people-white.svg" className="w-8 mr-2" />
                    <span>{room.playerCount}/6</span>
                  </div>
                  <span className="w-30 text-center">
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
                      <img src="assets/lock.svg" className="w-8" />
                    ) : (
                      <div className="w-8" />
                    )}
                  </div>

                  <div className="w-30 flex justify-end">
                    <GameButton
                      text="입장"
                      size="small"
                      variant="gray"
                      onClick={() => handleJoinRoom(room)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </SimpleBar>

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
            placeholder="방 코드 입력"
            onSubmit={handleSubmitCode}
            onClose={() => setIsCodeModalOpen(false)}
          />
        )}

        {/* 비밀번호 입력 모달 */}
        {isPasswordModalOpen && (
          <InputModal
            title="비밀번호 입력"
            placeholder="비밀번호 4자리 숫자 입력"
            numeric
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
