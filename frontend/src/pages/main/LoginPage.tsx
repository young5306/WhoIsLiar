import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameButton from '../../components/common/GameButton';
import InputField from '../../components/common/InputField';
import { useAuthStore } from '../../stores/useAuthStore';
import { loginApi } from '../../services/api/AuthService';
import { notify } from '../../components/common/Toast';
import { ArrowLeft } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const { setUserInfo } = useAuthStore();

  const handleLogin = async () => {
    try {
      const { token, nickname: returnedNickname } = await loginApi(nickname);
      setUserInfo({ token, nickname: returnedNickname });

      navigate('/room-list');
    } catch (err: any) {
      const st = err?.response?.status;
      if (st === 409) {
        notify({ type: 'error', text: '이미 사용 중인 닉네임입니다.' });
      } else if (st === 400) {
        notify({
          type: 'warning',
          text: '한글, 영문, 숫자 2~10자를 입력해주세요.',
        });
      } else {
        notify({ type: 'error', text: '로그인 중 문제가 발생했습니다.' });
      }
    }
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative flex flex-col items-center gap-6 h-screen justify-center">
      <div className="absolute top-6 left-6 z-10">
        <div
          className="inline-block p-1 bg-gray-900 rounded-full shadow-lg"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            className={`
              w-12 
              h-12 
              flex 
              items-center 
              justify-center 
              bg-point-button1 
              border-3 
              border-primary-600 
              rounded-full 
              cursor-pointer 
              transition-all 
              duration-300
              ${isHovered ? 'border-point-neon scale-110 rotate-[-15deg] brightness-140' : ''}
              active:brightness-90
            `}
            onClick={() => navigate('/')}
          >
            <ArrowLeft
              size={28}
              strokeWidth={3}
              className={`transition-colors duration-300 ${isHovered ? 'text-point-neon' : 'text-primary-600'}`}
            />
          </button>
        </div>
      </div>
      <h2 className="display-medium text-primary-600">닉네임 입력</h2>
      <InputField
        placeholder="닉네임 (2~10자)"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        onEnter={handleLogin}
      />
      <GameButton text="시작" onClick={handleLogin} />
    </div>
  );
};

export default LoginPage;
