import { Outlet, useLocation } from 'react-router-dom';

const bgImages: Record<string, { imageUrl: string; backgroundColor: string }> =
  {
    '/': {
      imageUrl: '/bgImages/mainBg3.svg',
      backgroundColor: 'bg-[#08050F]',
    },
    '/rule-book': {
      imageUrl: '/bgImages/ruleBookBg.svg',
      backgroundColor: 'bg-[#2F1914]',
    },
    '/login': {
      imageUrl: '/bgImages/loginBg3.svg',
      backgroundColor: 'bg-[#090A11]',
    },
    // '/room-list': { imageUrl: '/bgImages/bg4.svg', backgroundColor: 'bg-white' },
    // '/waiting': { imageUrl: '/bgImages/bg4.svg', backgroundColor: 'bg-white' },
    // '/game': { imageUrl: '/bgImages/bg4.svg', backgroundColor: 'bg-white' },
  };

const Layout = () => {
  const location = useLocation();
  const pageStyle = bgImages[location.pathname] || {
    imageUrl: '',
    backgroundColor: '',
  };

  return (
    <div
      className={`w-screen h-screen overflow-hidden ${pageStyle.backgroundColor}`}
    >
      {/* 배경 이미지 */}
      <img
        src={pageStyle.imageUrl}
        alt="배경 이미지"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-screen object-cover z-0"
      />
      {/* 컨텐츠 영역 */}
      <div className="relative w-full h-full p-8 z-10">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
