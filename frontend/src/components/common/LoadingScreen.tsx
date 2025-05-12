import React from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
      <img src="/assets/loading1.gif" alt="Loading..." className="w-32 h-32" />
    </div>
  );
};

export default LoadingScreen;
