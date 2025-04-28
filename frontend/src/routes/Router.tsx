import { Route, Routes } from 'react-router-dom';
import MainPage from '../pages/main/MainPage';

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
    </Routes>
  );
};

export default Router;
