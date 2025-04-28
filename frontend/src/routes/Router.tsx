import { Route, Routes } from 'react-router-dom';
import Layout from '../layouts/Layout';
import MainPage from '../pages/main/MainPage';
import RuleBookPage from '../pages/main/RuleBookPage';

const Router = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/rule-book" element={<RuleBookPage />} />
        {/* <Route path="/login" element={<LoginPage />} />
        <Route path="/room-list" element={<RoomListPage />} />
        <Route path="/waiting" element={<WaitingPage />} />
        <Route path="/game" element={<GamePage />} /> */}
      </Route>
    </Routes>
  );
};

export default Router;
