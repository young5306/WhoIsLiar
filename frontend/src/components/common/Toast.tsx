import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Props {
  text: string;
  type: string;
}

export const autoClose = 800;

// 최근 메시지를 추적하기 위한 변수
let lastToast: { text: string; timestamp: number } | null = null;
const TOAST_THROTTLE_TIME = 3000; // 3초 동안 중복 방지

export const notify = ({ type, text }: Props) => {
  const now = Date.now();

  // 중복 메시지 방지 로직
  if (
    lastToast &&
    lastToast.text === text &&
    now - lastToast.timestamp < TOAST_THROTTLE_TIME
  ) {
    return; // 중복된 메시지는 무시
  }

  lastToast = { text, timestamp: now }; // 현재 메시지를 저장

  switch (type) {
    case 'default':
      toast(text);
      break;
    case 'success':
      toast.success(text);
      break;
    case 'warning':
      toast.warning(text);
      break;
    case 'error':
      toast.error(text);
      break;
    case 'info':
      toast.info(text);
      break;
  }
};

const Toast = () => {
  return (
    <ToastContainer
      position="top-center"
      autoClose={autoClose}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss={false}
      draggable
      pauseOnHover={true}
      theme="light"
      limit={2}
      toastClassName="toast"
    />
  );
};

export default Toast;
