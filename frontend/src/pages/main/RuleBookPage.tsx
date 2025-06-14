import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomCursor from '../../components/CustomCursor';

const pageImages = [
  '/bgImages/ruleBook/1.webp',
  '/bgImages/ruleBook/2.webp',
  '/bgImages/ruleBook/3.webp',
  '/bgImages/ruleBook/4.webp',
  '/bgImages/ruleBook/5.webp',
  '/bgImages/ruleBook/6.webp',
];

const RuleBookPage = () => {
  const [pageIndex, setPageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  const handlePrev = () => {
    if (pageIndex > 0) {
      setImageLoaded(false);
      setPageIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (pageIndex < pageImages.length - 1) {
      setImageLoaded(false);
      setPageIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="relative w-screen h-screen bg-black">
      <CustomCursor />
      <img
        src={pageImages[pageIndex]}
        alt={`RuleBook Page ${pageIndex + 1}`}
        className={`absolute top-0 left-0 w-full h-full object-cover z-0 transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
      />

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
        <div className="w-[40px] flex justify-center">
          {pageIndex > 0 ? (
            <button onClick={handlePrev} className="cursor-pointer">
              <div className="w-0 h-0 border-y-[17px] border-r-[25px] border-y-transparent border-r-point-rulebook1 hover:border-r-point-rulebook2 drop-shadow-lg transition" />
            </button>
          ) : null}
        </div>

        <p className="text-point-rulebook1 headline-large w-[80px] text-center">
          {pageIndex + 1} / {pageImages.length}
        </p>

        <div className="w-[40px] flex justify-center">
          {pageIndex < pageImages.length - 1 ? (
            <button onClick={handleNext} className="cursor-pointer">
              <div className="w-0 h-0 border-y-[17px] border-l-[25px] border-y-transparent border-l-point-rulebook1 hover:border-l-point-rulebook2 drop-shadow-lg transition" />
            </button>
          ) : null}
        </div>
      </div>

      <button
        onClick={handleBack}
        className="absolute bottom-6 right-6 flex items-center gap-2 z-20 cursor-pointer"
      >
        <img src="assets/backIcon.webp" alt="뒤로가기" className="w-16 h-16" />
      </button>
    </div>
  );
};

export default RuleBookPage;
