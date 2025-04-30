import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import Router from './routes/Router';
import Toast from './components/common/Toast';

const Root = () => {
  return (
    <BrowserRouter>
      <Router />
      <Toast />
    </BrowserRouter>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<Root />);
