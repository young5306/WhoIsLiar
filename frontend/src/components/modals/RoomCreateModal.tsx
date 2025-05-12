import { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import GameButton2 from '../common/GameButton2';
import { createRoom } from '../../services/api/RoomService';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../stores/useRoomStore';
import { notify } from '../common/Toast';
import LoadingScreen from '../common/LoadingScreen';

interface RoomCreateModalProps {
  onClose: () => void;
}

const RoomCreateModal = ({ onClose }: RoomCreateModalProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { userInfo } = useAuthStore();
  const { setRoomCode } = useRoomStore();
  const hostNickname = userInfo?.nickname;

  const [videoMode, setVideoMode] = useState<'VIDEO' | 'BLIND' | undefined>(
    undefined
  );
  const [gameMode, setGameMode] = useState<'DEFAULT' | 'FOOL' | undefined>(
    undefined
  );
  const [roomName, setRoomName] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [password, setPassword] = useState('');
  const [roundCount, setRoundCount] = useState(0);

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleCreate = async () => {
    if (!videoMode)
      return notify({ type: 'warning', text: '화면모드를 선택해주세요.' });
    if (!gameMode)
      return notify({ type: 'warning', text: '게임모드를 선택해주세요.' });
    if (!roomName)
      return notify({ type: 'warning', text: '방 제목을 입력해주세요.' });
    if (!roundCount)
      return notify({ type: 'warning', text: '라운드 수를 선택해주세요.' });
    if (isSecret && !/^\d{4}$/.test(password))
      return notify({
        type: 'warning',
        text: '비밀번호는 4자리 숫자여야 합니다.',
      });

    const params = {
      hostNickname: hostNickname ?? '',
      videoMode,
      gameMode,
      roomName,
      password: isSecret ? password : '',
      roundCount,
    };

    try {
      setIsLoading(true);
      const response = await createRoom(params);
      const roomCode = response.data.room.roomCode;
      console.log('roomCode', roomCode);
      setRoomCode(roomCode);
      navigate(`/waiting-room?roomCode=${roomCode}`);
    } catch (err: any) {
      const st = err?.response?.status;
      if (st === 409) {
        notify({
          type: 'error',
          text: '이미 다른 방에 참여 중이거나 생성한 방이 존재합니다.',
        });
      } else {
        notify({ type: 'error', text: '방 생성 중 오류가 발생했습니다.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LoadingScreen isVisible={isLoading} />
      <div
        className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="text-primary-600 relative bg-gray-900 border-1 border-primary-600 rounded-xl w-[450px] px-6 py-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIsHelpOpen(true)}
            className="absolute top-3 left-3"
          >
            <img
              src="assets/toolTip.png"
              alt="도움말"
              className="w-6 h-6 cursor-pointer"
            />
          </button>

          {isHelpOpen && (
            <div
              className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50"
              onClick={() => setIsHelpOpen(false)}
            >
              <div
                className="bg-gray-0 text-gray-900 p-6 rounded-xl w-[450px] headline-small"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-5">도움말</h3>

                <p className="leading-relaxed mb-5">
                  모드, 방 제목, 라운드 수는 <strong>필수</strong> 항목이며,
                  <br />
                  비밀번호 설정은 <strong>선택</strong> 항목입니다.
                </p>

                <div className="mb-4">
                  <p className="mb-1 text-point-rulebook2">[화면 모드]</p>
                  <p className="leading-relaxed">
                    <strong>비디오 모드</strong>는 화면을 공유하는 모드이며,
                    <br />
                    <strong>블라인드 모드</strong>는 화면을 공유하지 않는
                    모드입니다.
                  </p>
                </div>

                <div className="mb-4">
                  <p className="mb-1 text-point-rulebook2">[제시어 모드]</p>
                  <p className="leading-relaxed">
                    <strong>일반 모드</strong>는 라이어에게 라이어임을 알리고
                    <br />
                    제시어를 제공하지 않는 모드입니다.
                    <br />
                    <strong>바보 모드</strong>는 라이어에게 라이어임을 알리지
                    않고
                    <br />
                    다른 제시어를 제공하는 모드입니다.
                  </p>
                </div>

                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="mt-5 text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          <h2 className="display-medium text-center mb-4">방 만들기</h2>

          <div className="mb-4">
            <h3 className="headline-medium mb-2">화면모드</h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setVideoMode('VIDEO')}
                className={`flex-1 p-2 rounded-md border-2 cursor-pointer ${videoMode === 'VIDEO' ? 'border-primary-600 bg-gradient-to-br from-[#A41D55] to-[#3C0B38]' : 'border-[#734AA1]'}`}
              >
                <img
                  src="assets/videoMode.png"
                  alt="비디오 모드"
                  className="w-20 mx-auto"
                />
                <p className="body-medium mt-2 text-primary-600">비디오 모드</p>
              </button>
              <button
                onClick={() => setVideoMode('BLIND')}
                className={`flex-1 p-2 rounded-md border-2 cursor-pointer ${videoMode === 'BLIND' ? 'border-primary-600 bg-gradient-to-br from-[#A41D55] to-[#3C0B38]' : 'border-[#734AA1]'}`}
              >
                <img
                  src="assets/blindMode.png"
                  alt="블라인드 모드"
                  className="w-20 mx-auto"
                />
                <p className="body-medium mt-2 text-primary-600">
                  블라인드 모드
                </p>
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="headline-medium mb-2">게임모드</h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setGameMode('DEFAULT')}
                className={`flex-1 p-2 rounded-md border-2 cursor-pointer ${gameMode === 'DEFAULT' ? 'border-primary-600 bg-gradient-to-br from-[#A41D55] to-[#3C0B38]' : 'border-[#734AA1]'}`}
              >
                <img
                  src="assets/defaultMode.png"
                  alt="일반 모드"
                  className="w-20 mx-auto"
                />
                <p className="body-medium mt-2 text-primary-600">일반 모드</p>
              </button>
              <button
                onClick={() => setGameMode('FOOL')}
                className={`flex-1 p-2 rounded-md border-2 cursor-pointer ${gameMode === 'FOOL' ? 'border-primary-600 bg-gradient-to-br from-[#A41D55] to-[#3C0B38]' : 'border-[#734AA1]'}`}
              >
                <img
                  src="assets/foolMode.png"
                  alt="바보 모드"
                  className="w-20 mx-auto"
                />
                <p className="body-medium mt-2 text-primary-600">바보 모드</p>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-3 text-primary-600 headline-medium">
            <div className="flex items-center gap-4">
              <label className="w-25">방 제목</label>
              <input
                type="text"
                placeholder="방 제목 입력 (최대 15자)"
                maxLength={15}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className={`w-full flex-1 border-2 rounded-lg px-2 py-1 headline-small placeholder-[#734AA1] bg-gray-900/20 outline-none 
                  ${roomName ? 'border-primary-600' : 'border-[#734AA1]'} 
                  focus:border-primary-600`}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="w-25">비밀번호</label>

              <input
                type="checkbox"
                id="secretCheck"
                checked={isSecret}
                onChange={() => setIsSecret((prev) => !prev)}
                className="peer hidden"
              />

              {/* 커스텀 체크 박스 */}
              <div
                onClick={() => setIsSecret((prev) => !prev)}
                className={`w-6 h-6 border-2 rounded-sm cursor-pointer flex items-center justify-center
                  ${isSecret ? 'border-primary-600' : 'border-[#734AA1]'}`}
              >
                {isSecret && (
                  <span className="text-primary-600 text-sm font-bold">✓</span>
                )}
              </div>

              <input
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                placeholder="비밀번호 4자리 숫자 입력"
                value={password}
                onChange={(e) => {
                  const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                  setPassword(onlyNums);
                }}
                className={`flex-1 min-w-0 border-2 rounded-lg px-2 py-1 headline-small placeholder-[#734AA1] bg-gray-900/20 outline-none
                  ${isSecret ? '' : 'invisible pointer-events-none'}
                  ${password ? 'border-primary-600' : 'border-[#734AA1]'}
                  focus:border-primary-600`}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="w-25">라운드</label>
              <div className="flex justify-between flex-1">
                {[3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setRoundCount(num)}
                    className={`w-22 h-9 flex items-center justify-center rounded-md border-2 headline-small cursor-pointer ${
                      roundCount === num
                        ? 'border-primary-600 text-primary-600'
                        : 'border-[#734AA1] text-[#734AA1]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <div className="flex-1">
              <GameButton2 text="취소" onClick={onClose} />
            </div>
            <div>
              <GameButton2 text="방 만들기" onClick={handleCreate} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RoomCreateModal;
