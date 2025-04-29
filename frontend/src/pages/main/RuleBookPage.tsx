import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const pageImages = [
  '/bgImages/ruleBook/1.svg',
  '/bgImages/ruleBook/2.svg',
  '/bgImages/ruleBook/3.svg',
  '/bgImages/ruleBook/4.svg',
  '/bgImages/ruleBook/5.svg',
];

const RuleBookPage = () => {
  const [pageIndex, setPageIndex] = useState(0);
  const navigate = useNavigate();

  const handlePrev = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    }
  };

  const handleNext = () => {
    if (pageIndex < pageImages.length - 1) {
      setPageIndex(pageIndex + 1);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="relative w-screen h-screen">
      {/* 페이지별 전용 배경 이미지 */}
      <img
        src={pageImages[pageIndex]}
        alt={`RuleBook Page ${pageIndex + 1}`}
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />

      {/* 가운데 화살표 + 페이지 표시 */}
      <div className="absolute bottom-17 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
        {/* 왼쪽 화살표 or 빈 공간 */}
        <div className="w-[40px] flex justify-center">
          {pageIndex > 0 ? (
            <button onClick={handlePrev}>
              <div className="w-0 h-0 border-y-[17px] border-r-[25px] border-y-transparent border-r-point-rulebook1 hover:border-r-point-rulebook2 drop-shadow-lg transition" />
            </button>
          ) : null}
        </div>

        {/* 현재 페이지 표시 */}
        <p className="text-point-rulebook1 headline-large w-[80px] text-center">
          {pageIndex + 1} / {pageImages.length}
        </p>

        {/* 오른쪽 화살표 or 빈 공간 */}
        <div className="w-[40px] flex justify-center">
          {pageIndex < pageImages.length - 1 ? (
            <button onClick={handleNext}>
              <div className="w-0 h-0 border-y-[17px] border-l-[25px] border-y-transparent border-l-point-rulebook1 hover:border-l-point-rulebook2 drop-shadow-lg transition" />
            </button>
          ) : null}
        </div>
      </div>

      {/* 오른쪽 하단 뒤로가기 버튼 추가 */}
      <button
        onClick={handleBack}
        className="absolute bottom-6 right-6 flex items-center gap-2 z-20 cursor-pointer"
      >
        <img src="/backIcon.png" alt="뒤로가기" className="w-16 h-16" />
      </button>
    </div>
  );
};

export default RuleBookPage;
