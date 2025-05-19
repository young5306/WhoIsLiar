import { Outlet, useLocation } from 'react-router-dom';
import BackgroundMusic from '../components/common/BackgroundMusic';
import useCustomCursor from '../hooks/useCustomCursor';
import '../styles/cursor.css';
import CustomCursor from '../components/CustomCursor';

const bgImages: Record<string, { imageUrl: string; backgroundColor: string }> =
  {
    '/': {
      imageUrl: '/bgImages/mainBg.webp',
      backgroundColor: 'bg-[#08050F]',
    },
    '/login': {
      imageUrl: '/bgImages/loginBg.webp',
      backgroundColor: 'bg-[#090a11]',
    },
    '/waiting-room': {
      imageUrl: '/bgImages/waitingBg.webp',
      backgroundColor: 'bg-[#211926]',
    },
    '/room-list': {
      imageUrl: '/bgImages/waitingBg.webp',
      backgroundColor: 'bg-[#211926]',
    },
    '/game-room': {
      imageUrl: '/bgImages/waitingBg.webp',
      backgroundColor: 'bg-[#211926]',
    },
  };

const defaultStyle = {
  imageUrl: '/bgImages/mainBg.svg',
  backgroundColor: 'bg-[#211926]',
};

const Layout = () => {
  const location = useLocation();
  const pageStyle = bgImages[location.pathname] || defaultStyle;
  useCustomCursor();

  return (
    <div
      className={`w-screen h-screen overflow-hidden ${pageStyle.backgroundColor}`}
    >
      <CustomCursor />
      {/* 배경 이미지 */}
      <img
        src={pageStyle.imageUrl}
        alt="배경 이미지"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-screen object-cover z-0
             [mask-image:radial-gradient(circle,rgba(0,0,0,1)_60%,rgba(0,0,0,0)_100%)]
             [-webkit-mask-image:radial-gradient(circle,rgba(0,0,0,1)_60%,rgba(0,0,0,0)_100%)]"
      />

      {/* 컨텐츠 영역 */}
      <div className="relative w-full h-full pt-8 z-10">
        <Outlet />
      </div>

      {/* 배경음악 컨트롤 */}
      <BackgroundMusic />
    </div>
  );
};

export default Layout;
