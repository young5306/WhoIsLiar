import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameButton from '../../components/common/GameButton';
import InputField from '../../components/common/InputField';
import { useAuthStore } from '../../stores/useAuthStore';
import { loginApi } from '../../services/api/AuthService';

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
      if (err.response?.status === 409) {
        alert('이미 사용 중인 닉네임입니다.');
      } else if (err.response?.status === 400) {
        alert('닉네임을 입력해주세요.');
      } else {
        alert('로그인 중 문제가 발생했습니다.');
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 h-screen justify-center">
      <h2 className="display-medium text-primary-600">닉네임 입력</h2>
      <InputField
        placeholder="닉네임"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <GameButton text="시작" onClick={handleLogin} />
    </div>
  );
};

export default LoginPage;
