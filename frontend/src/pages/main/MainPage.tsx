import { useNavigate } from 'react-router-dom';
import GameButton from '../../components/common/GameButton';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEffect } from 'react';
import { useRoomStore } from '../../stores/useRoomStore';
import logo from '/assets/logo.png';

const MainPage = () => {
  const navigate = useNavigate();
  const { clearUserInfo } = useAuthStore();
  const { clearRoomCode } = useRoomStore();

  useEffect(() => {
    clearUserInfo();
    clearRoomCode();
  }, [clearUserInfo, clearRoomCode]);

  const handleStartGame = () => {
    navigate('/login');
  };

  const handleRuleBook = () => {
    navigate('/rule-book');
  };

  return (
    <div className="relative h-screen">
      <img
        src={logo}
        alt="믿지마"
        className="absolute top-1/7 left-1/2 -translate-x-1/2 w-auto h-100"
      />
      <div className="absolute top-[55%] left-1/2 -translate-x-1/2 flex flex-col gap-6">
        <GameButton text="게임 시작" size="large" onClick={handleStartGame} />
        <GameButton text="룰북" size="large" onClick={handleRuleBook} />
      </div>
    </div>
  );
};

export default MainPage;
