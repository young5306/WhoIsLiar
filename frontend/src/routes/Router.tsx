import { Route, Routes } from 'react-router-dom';
import Layout from '../layouts/Layout';
import MainPage from '../pages/main/MainPage';
import RuleBookPage from '../pages/main/RuleBookPage';
import LoginPage from '../pages/main/LoginPage';

import GameVid from '../pages/game/GameVid';
import WaitingRoomPage from '../pages/waitingRoom/WaitingRoomPage';
import { RoomListPage } from '../pages/roomList/RoomListPage';

const Router = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/room-list" element={<RoomListPage />} />
        {/* <Route path="/game" element={<GamePage />} /> */}
        <Route path="/waitingRoom" element={<WaitingRoomPage />} />

        {/* openvidu */}
        <Route path="/game-vid" element={<GameVid />} />
      </Route>
      <Route path="/rule-book" element={<RuleBookPage />} />
    </Routes>
  );
};

export default Router;
