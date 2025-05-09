import { Route, Routes, Navigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import MainPage from '../pages/main/MainPage';
import RuleBookPage from '../pages/main/RuleBookPage';
import LoginPage from '../pages/main/LoginPage';
import { useAuthStore } from '../stores/useAuthStore';
import { useRoomStore } from '../stores/useRoomStore';

import GameRoom from '../pages/game/GameRoom';

import WaitingRoomPage from '../pages/waitingRoom/WaitingRoomPage';
import RoomListPage from '../pages/roomList/RoomListPage';
import ModalTestPage from '../pages/gameModal/ModalTestPage';

// 기본 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { userInfo } = useAuthStore();

  if (!userInfo) {
    // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 게임 관련 보호된 라우트 컴포넌트
const GameRoomProtectedRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userInfo } = useAuthStore();
  const { roomCode } = useRoomStore();

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  if (!roomCode) {
    return <Navigate to="/room-list" replace />;
  }

  return <>{children}</>;
};

const Router = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/room-list"
          element={
            <ProtectedRoute>
              <RoomListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiting-room"
          element={
            <GameRoomProtectedRoute>
              <WaitingRoomPage />
            </GameRoomProtectedRoute>
          }
        />

        {/* openvidu */}
        <Route
          path="/game-room"
          element={
            // <GameRoomProtectedRoute>
            <GameRoom />
            // </GameRoomProtectedRoute>
          }
        />
      </Route>
      <Route path="/rule-book" element={<RuleBookPage />} />
      <Route
        path="/modal"
        element={
          <ProtectedRoute>
            <ModalTestPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default Router;
