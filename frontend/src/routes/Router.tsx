import { Route, Routes } from 'react-router-dom';
import Layout from '../layouts/Layout';
import MainPage from '../pages/main/MainPage';
import RuleBookPage from '../pages/main/RuleBookPage';
import LoginPage from '../pages/main/LoginPage';

import GameRoom from '../pages/game/GameRoom';
// import LiarGame from '../pages/game/LiarGame';
// import Wait2Game from '../pages/game/waitToGameTest';
import WaitingRoomPage from '../pages/waitingRoom/WaitingRoomPage';
import RoomListPage from '../pages/roomList/RoomListPage';
import ModalTestPage from '../pages/gameModal/ModalTestPage';

const Router = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/room-list" element={<RoomListPage />} />
        {/* <Route path="/game" element={<GamePage />} /> */}
        <Route path="/waiting-room" element={<WaitingRoomPage />} />

        {/* openvidu */}
        <Route path="/game-room" element={<GameRoom />} />
        {/* openvidu-test */}
        {/* <Route path="/liar-game" element={<LiarGame />} />
        <Route path="/wait2game" element={<Wait2Game />} /> */}
      </Route>
      <Route path="/rule-book" element={<RuleBookPage />} />
      <Route path="/modal" element={<ModalTestPage />} />
    </Routes>
  );
};

export default Router;
