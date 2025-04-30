import { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import GameButton2 from '../common/GameButton2';
import { createRoom } from '../../services/api/RoomService';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../stores/useRoomStore';

interface RoomCreateModalProps {
  onClose: () => void;
}

const RoomCreateModal = ({ onClose }: RoomCreateModalProps) => {
  const navigate = useNavigate();

  const { userInfo } = useAuthStore();
  const { setRoomCode } = useRoomStore();
  const hostNickname = userInfo?.nickname;

  const [mode, setMode] = useState<'VIDEO' | 'BLIND'>('VIDEO');
  const [roomName, setRoomName] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [password, setPassword] = useState('');
  const [roundCount, setRoundCount] = useState(0);

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleCreate = async () => {
    if (!roomName) return alert('방 제목을 입력해주세요.');
    if (!roundCount) return alert('라운드 수를 선택해주세요');
    if (isSecret && !/^\d{4}$/.test(password)) {
      return alert('비밀번호는 4자리 숫자여야 합니다.');
    }

    const params = {
      hostNickname: hostNickname ?? '',
      mode,
      roomName,
      password: isSecret ? password : '',
      roundCount,
    };

    try {
      const response = await createRoom(params);
      const roomCode = response.data.room.roomCode;
      setRoomCode(roomCode);
      onClose();
      navigate('/waiting-room');
    } catch (err) {
      alert('방 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50">
      <div className="text-primary-600 relative bg-gray-900 border-1 border-primary-600 rounded-xl w-[530px] p-6">
        <button
          onClick={() => setIsHelpOpen(true)}
          className="absolute top-2 left-2"
        >
          <img
            src="assets/toolTip.png"
            alt="도움말"
            className="w-5 h-5 cursor-pointer"
          />
        </button>

        {isHelpOpen && (
          <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50">
            <div className="bg-gray-0 text-gray-900 p-6 rounded-xl w-[300px] text-sm">
              <h3 className="body-medium mb-2">도움말</h3>
              <p>
                일반 모드는 화면을 공유하는 모드, 블라인드 모드는 화면을
                공유하지 않는 모드입니다.
                <br />
                <br />
                방제목과 라운드 수는 필수, 비밀번호 설정은 선택 항목입니다.
              </p>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="mt-4 text-gray-500 cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        <h2 className="display-medium text-center mb-4">방 만들기</h2>

        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setMode('VIDEO')}
            className={`p-2 rounded-md border-3 cursor-pointer ${mode === 'VIDEO' ? 'border-primary-600 bg-gradient-to-br from-[#A41D55] to-[#3C0B38]' : 'border-point-button1'}`}
          >
            <img src="assets/videoMode.png" alt="일반모드" className="" />
            <p className="body-medium mt-2 text-primary-600">일반 모드</p>
          </button>
          <button
            onClick={() => setMode('BLIND')}
            className={`p-2 rounded-md border-3 cursor-pointer ${mode === 'BLIND' ? 'border-primary-600 bg-gradient-to-br from-[#A41D55] to-[#3C0B38]' : 'border-point-button1'}`}
          >
            <img src="assets/blindMode.png" alt="블라인드모드" className="" />
            <p className="body-medium mt-2 text-primary-600">블라인드 모드</p>
          </button>
        </div>

        <div className="flex flex-col gap-6 mb-3 text-primary-600 headline-xlarge">
          <div className="flex items-center gap-4">
            <label className="w-30">방 제목</label>
            <input
              type="text"
              placeholder="방 제목을 입력하세요"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className={`w-full flex-1 border-3 rounded-lg px-3 py-2 placeholder-point-button1 bg-gray-900/20 outline-none 
                ${roomName ? 'border-primary-600' : 'border-point-button1'} 
                focus:border-primary-600`}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="w-30">비밀번호</label>

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
              className={`w-6 h-6 border-3 rounded-sm cursor-pointer flex items-center justify-center
                ${isSecret ? 'border-primary-600' : 'border-point-button1'}`}
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
              placeholder="4자리 숫자 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`flex-1 min-w-0 border-3 rounded-lg px-2 py-1 placeholder-point-button1 bg-gray-900/20 outline-none
                ${isSecret ? '' : 'invisible pointer-events-none'}
                ${password ? 'border-primary-600' : 'border-point-button1'}
                focus:border-primary-600`}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="w-30">라운드</label>
            <div className="flex justify-between flex-1">
              {[3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setRoundCount(num)}
                  className={`w-25 h-12 flex items-center justify-center rounded-md border-3 headline-medium cursor-pointer ${
                    roundCount === num
                      ? 'border-primary-600 text-primary-600'
                      : 'border-point-button1 text-point-button1'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <div className="flex-1">
            <GameButton2 text="취소" onClick={onClose} />
          </div>
          <div className="flex-2">
            <GameButton2 text="방 만들기" onClick={handleCreate} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCreateModal;
