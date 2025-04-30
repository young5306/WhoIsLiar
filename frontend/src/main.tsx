import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import Router from './routes/Router';
import Toast from './components/common/Toast';
import { WebSocketProvider } from './contexts/WebSocketProvider';

const Root = () => {
  return (
    <BrowserRouter>
      <WebSocketProvider>
        <Router />
        <Toast />
      </WebSocketProvider>
    </BrowserRouter>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<Root />);
