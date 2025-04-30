import { useNavigate } from 'react-router-dom';
import { GameButton } from '../../components/common/GameButton';

const MainPage = () => {
  const navigate = useNavigate();

  const handleStartGame = () => {
    navigate('/login');
  };

  const handleRuleBook = () => {
    navigate('/rule-book');
  };

  return (
    <div className="relative h-screen">
      <h1 className="absolute top-2/5 left-1/2 -translate-x-1/2 text-primary-600 display-xlarge">
        믿지마
      </h1>
      <div className="absolute top-[55%] left-1/2 -translate-x-1/2 flex flex-col gap-6">
        <GameButton text="게임 시작" size="large" onClick={handleStartGame} />
        <GameButton text="룰북" size="large" onClick={handleRuleBook} />
      </div>
    </div>
  );
};

export default MainPage;
