import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const BackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 오디오 요소 생성
    audioRef.current = new Audio('/assets/background-music.mp3'); // 실제 음악 파일 경로로 수정 필요
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    // 8초 후에 툴팁 자동으로 숨기기
    const tooltipTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 8000);

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      clearTimeout(tooltipTimer);
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error) => {
        console.error('Failed to play audio:', error);
      });
    }
    setIsPlaying(!isPlaying);
    setShowTooltip(false); // 클릭 시 툴팁 숨기기
  };

  return (
    <div className="fixed bottom-8 left-8 z-50">
      {/* 애니메이션이 있는 툴팁/말풍선 - 오른쪽에 배치 */}
      {showTooltip && (
        <div className="absolute bottom-1/2 left-full transform -translate-y-1/2 ml-3 bg-primary-600 text-white px-3 py-2 rounded-lg shadow-lg animate-pulse">
          <div className="absolute left-[-8px] top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-primary-600"></div>
          <p className="whitespace-nowrap font-medium">배경음악 켜기 🎵</p>
        </div>
      )}

      <button
        onClick={toggleMusic}
        className={`bg-gray-600/80 hover:bg-gray-800/80 p-3 rounded-full transition-all duration-200 cursor-pointer ${
          showTooltip ? 'animate-bounce' : ''
        }`}
        aria-label={isPlaying ? '배경음악 끄기' : '배경음악 켜기'}
      >
        {isPlaying ? (
          <Volume2 className="w-6 h-6 text-primary-600" />
        ) : (
          <VolumeX className="w-6 h-6 text-primary-600" />
        )}
      </button>
    </div>
  );
};

export default BackgroundMusic;
