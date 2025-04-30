import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import Router from './routes/Router';
import { WebSocketProvider } from './contexts/WebSocketProvider';
import Toast from './components/common/Toast';
// import { useRoomStore } from './stores/useRoomStore';

const Root = () => {
  // const { roomCode } = useRoomStore(); // Zustand로 가져오기
  // console.log('roomCode', roomCode); // Zustand로 가져오기
  const roomCode = 'Fdawge'; // 임시로 하드코딩
  return (
    <BrowserRouter>
      {roomCode ? (
        <WebSocketProvider roomCode={roomCode}>
          <Router />
        </WebSocketProvider>
      ) : (
        <Router />
      )}
      <Toast />
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')!).render(<Root />);
