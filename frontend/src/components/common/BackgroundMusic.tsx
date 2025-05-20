import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, MousePointer, MousePointer2 } from 'lucide-react';

const BackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isClickSoundEnabled, setIsClickSoundEnabled] = useState(true);
  const [showMusicTooltip, setShowMusicTooltip] = useState(true);
  const [showClickTooltip, setShowClickTooltip] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 오디오 요소 생성 및 설정
    if (!audioRef.current) {
      audioRef.current = new Audio('/assets/background-music.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
    }

    // 8초 후에 툴팁 자동으로 숨기기
    const tooltipTimer = setTimeout(() => {
      setShowMusicTooltip(false);
      setShowClickTooltip(false);
    }, 8000);

    return () => {
      clearTimeout(tooltipTimer);
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Failed to play audio:', error);
        });
      }
    }
    setIsPlaying(!isPlaying);
    setShowMusicTooltip(false);
  };

  const toggleClickSound = () => {
    setIsClickSoundEnabled(!isClickSoundEnabled);
    setShowClickTooltip(false);

    // 이벤트 디스패치를 requestAnimationFrame으로 감싸서 성능 최적화
    requestAnimationFrame(() => {
      const event = new CustomEvent('toggleClickSound', {
        detail: !isClickSoundEnabled,
      });
      document.dispatchEvent(event);
    });
  };

  return (
    <div className="fixed bottom-8 left-8 z-50 flex flex-col gap-2">
      {/* 클릭 소리 토글 버튼 */}
      <div className="relative">
        <button
          onClick={toggleClickSound}
          className={`bg-gray-600/80 hover:bg-gray-800/80 p-3 rounded-full transition-all duration-200 ${
            showClickTooltip ? 'animate-bounce' : ''
          } ${!isClickSoundEnabled ? 'opacity-50' : ''}`}
          aria-label={isClickSoundEnabled ? '클릭 소리 끄기' : '클릭 소리 켜기'}
        >
          {isClickSoundEnabled ? (
            <MousePointer className="w-6 h-6 text-primary-600" />
          ) : (
            <MousePointer2 className="w-6 h-6 text-primary-600" />
          )}
        </button>

        {/* 클릭 소리 툴팁 */}
        {showClickTooltip && (
          <div className="absolute bottom-1/2 left-full transform -translate-y-1/2 ml-3 bg-primary-600 text-white px-3 py-2 rounded-lg shadow-lg animate-pulse">
            <div className="absolute left-[-8px] top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-primary-600"></div>
            <p className="whitespace-nowrap font-medium">클릭 소리 켜기 🔊</p>
          </div>
        )}
      </div>

      {/* 배경음악 토글 버튼 */}
      <div className="relative">
        <button
          onClick={toggleMusic}
          className={`bg-gray-600/80 hover:bg-gray-800/80 p-3 rounded-full transition-all duration-200 ${
            showMusicTooltip ? 'animate-bounce' : ''
          }`}
          aria-label={isPlaying ? '배경음악 끄기' : '배경음악 켜기'}
        >
          {isPlaying ? (
            <Volume2 className="w-6 h-6 text-primary-600" />
          ) : (
            <VolumeX className="w-6 h-6 text-primary-600" />
          )}
        </button>

        {/* 배경음악 툴팁 */}
        {showMusicTooltip && (
          <div className="absolute bottom-1/2 left-full transform -translate-y-1/2 ml-3 bg-primary-600 text-white px-3 py-2 rounded-lg shadow-lg animate-pulse">
            <div className="absolute left-[-8px] top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-primary-600"></div>
            <p className="whitespace-nowrap font-medium">배경음악 켜기 🎵</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundMusic;
