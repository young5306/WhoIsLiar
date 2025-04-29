import { Route, Routes } from 'react-router-dom';
import Layout from '../layouts/Layout';
import MainPage from '../pages/main/MainPage';
import RuleBookPage from '../pages/main/RuleBookPage';
import LoginPage from '../pages/main/LoginPage';
import WaitingRoomPage from '../pages/waitingRoom/WaitingRoomPage';

const Router = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/waitingRoom" element={<WaitingRoomPage />} />
      </Route>
      <Route path="/rule-book" element={<RuleBookPage />} />
    </Routes>
  );
};

export default Router;
