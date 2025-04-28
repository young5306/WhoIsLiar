import GameButton from '../../components/common/GameButton';
import InputField from '../../components/common/InputField';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/room-list');
  };

  return (
    <div className="flex flex-col items-center gap-6 h-screen justify-center">
      <h2 className="display-medium text-primary-600">닉네임 입력</h2>
      <InputField placeholder="닉네임" />
      <GameButton text="시작" onClick={handleLogin} />
    </div>
  );
};

export default LoginPage;
