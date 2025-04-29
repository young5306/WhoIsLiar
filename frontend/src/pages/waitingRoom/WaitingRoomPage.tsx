import GameButton from '../../components/common/GameButton';
import { createRoom } from '../../services/api/RoomService';
import { useRoomStore } from '../../stores/useRoomStore';

const WaitingRoomPage = () => {
  const categories = [
    { label: '랜덤', id: 'random' },
    { label: '물건', id: 'object' },
    { label: '인물', id: 'person' },
    { label: '음식', id: 'food' },
    { label: '나라', id: 'country' },
    { label: '스포츠', id: 'sports' },
    { label: '직업', id: 'job' },
    { label: '동물', id: 'animal', highlight: true },
    { label: '노래', id: 'song' },
    { label: '장소', id: 'place' },
    { label: '영화/드라마', id: 'movie' },
    { label: '브랜드', id: 'brand' },
  ];

  const { setRoomCode } = useRoomStore();

  const handleCreateRoom = async () => {
    const param = {
      hostNickname: '웹소켓테스트',
      mode: 'VIDEO',
      roomName: '아무나 들어오세요',
      password: '1234',
      roundCount: 3,
    };
    const response = await createRoom(param);
    if (response.status === 200) {
      const roomCode = response.data.roomCode;
      setRoomCode(roomCode);
    } else {
      // 방 생성 실패 처리
    }
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden p-20 py-10">
      {/* Left section */}
      <div className="flex-1 flex-col px-10">
        {/* Header */}
        <div className="text-white headline-large" onClick={handleCreateRoom}>
          방만들기 임시 버튼
        </div>
        <div className="flex items-center mb-6">
          <div className="text-white headline-large">게임방 제목</div>
          <div className="text-white body-medium ml-3">
            Code : 1234 587 8912
          </div>
        </div>

        {/* Player count */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <img
              src="/assets/people-fill.svg"
              alt="people-fill"
              width={36}
              height={36}
              className="text-rose-600"
            />
            <div className="text-primary-600 headline-large">플레이어</div>
          </div>
          <div className="text-primary-600 headline-large ml-4">5/6</div>
        </div>

        {/* Player and analysis section */}
        <div className="flex mb-10 gap-6">
          {/* Player profile */}
          <div className="flex flex-col">
            <div className="w-72 h-60 rounded-2xl overflow-hidden bg-gray-800 mb-2">
              <img
                src="/placeholder.svg?height=241&width=287"
                alt="Player"
                width={287}
                height={241}
                className="object-cover"
              />
            </div>
            <div className="text-black text-base font-['FUNFLOW_SURVIVOR_KR'] bg-white px-2 py-1 rounded w-fit">
              김싸피
            </div>

            {/* Camera and mic controls */}
            <div className="flex justify-center gap-4 mt-2">
              <button className="bg-gray-700/80 rounded-full p-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    width="24"
                    height="24"
                    rx="12"
                    fill="#4B4B4B"
                    fillOpacity="0.8"
                  />
                  <path
                    d="M15 10L15 14"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 13L12 14"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 11L9 14"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button className="bg-gray-700/80 rounded-full p-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    width="24"
                    height="24"
                    rx="12"
                    fill="#4B4B4B"
                    fillOpacity="0.8"
                  />
                  <path
                    d="M12 14C13.1046 14 14 13.1046 14 12V8C14 6.89543 13.1046 6 12 6C10.8954 6 10 6.89543 10 8V12C10 13.1046 10.8954 14 12 14Z"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 16V18"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Emotion analysis box */}
          <div className="w-40 h-80 bg-red-950 rounded-2xl border-2 border-primary-600 flex flex-col items-center justify-center">
            <div className="w-32 mb-4">
              <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0,20 Q25,5 50,20 T100,20"
                  stroke="#FF2D55"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
            <div className="text-center text-rose-600 text-base font-['FUNFLOW_SURVIVOR_KR'] leading-10">
              <p>당황 ↑</p>
              <p>목소리 급변 감지</p>
              <p>무표정</p>
            </div>
          </div>

          {/* Player list */}
          <div className="ml-6 space-y-4">
            {['도비', '라이어고수', '프신', '진짜시민'].map((name) => (
              <div key={name} className="flex items-center gap-2">
                <img
                  src="/assets/people-fill.svg"
                  alt="people"
                  width={24}
                  height={24}
                />
                <div className="text-white text-xl font-['FUNFLOW_SURVIVOR_KR']">
                  {name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category section */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <img
              src="/assets/category.svg"
              alt="category"
              width={36}
              height={36}
            />
            <div className="text-primary-600 headline-large">
              제시어 카테고리
            </div>
          </div>

          <div className="bg-gray-200 rounded-xl p-6">
            <div className="grid grid-cols-4 gap-x-12 gap-y-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`text-center text-xl font-['FUNFLOW_SURVIVOR_KR'] ${
                    category.highlight
                      ? 'text-rose-600 font-bold [text-shadow:_2px_2px_4px_rgba(0,0,0,0.25)]'
                      : 'text-white'
                  }`}
                >
                  {category.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right section - Chat */}
      <div className="w-1/4 ml-6 flex flex-col">
        <div className="flex-1 bg-gray-200 rounded-xl p-4 flex flex-col">
          <div className="flex-1 space-y-4">
            <div className="flex flex-col">
              <span className="font-bold">도비</span>
              <span className="text-white">안녕하세요</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-green-500">나</span>
              <span className="text-green-500">안녕하세요</span>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-400">
            채팅을 입력하세요.
          </div>
        </div>

        {/* Exit / Start button */}
        <div className="flex justify-end mt-4">
          <GameButton text="시작" />
        </div>
      </div>
    </div>
  );
};

export default WaitingRoomPage;
