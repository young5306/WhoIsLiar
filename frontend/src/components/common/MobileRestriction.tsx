import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MIN_WIDTH = 1200; // 최소 너비 (px)

const MobileRestriction: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MIN_WIDTH);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    // 배경 이미지 미리 로드
    const img = new Image();
    img.src = '/bgImages/loginBg.svg';
    img.onload = () => setIsImageLoaded(true);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MIN_WIDTH);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isMobile && isImageLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{
              backgroundImage: 'url(/bgImages/loginBg.svg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* 어두운 오버레이 추가 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{
                duration: 0.8,
                ease: [0.32, 0.72, 0, 1],
                delay: 0.2,
              }}
              className="relative bg-gray-800/90 backdrop-blur-sm p-8 rounded-xl max-w-md text-center border border-gray-700/50"
            >
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  ease: [0.32, 0.72, 0, 1],
                  delay: 0.4,
                }}
                className="text-2xl font-bold text-white mb-4"
              >
                PC 전용 서비스
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  ease: [0.32, 0.72, 0, 1],
                  delay: 0.5,
                }}
                className="text-gray-300 mb-6"
              >
                현재 서비스는 PC 환경에서만 이용 가능합니다.
                <br />
                화면 너비 {MIN_WIDTH}px 이상의 환경에서 접속해주세요.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.6,
                  ease: [0.32, 0.72, 0, 1],
                  delay: 0.6,
                }}
                className="text-sm text-gray-400"
              >
                현재 화면 너비: {window.innerWidth}px
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {!isMobile && children}
    </>
  );
};

export default MobileRestriction;
