import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const BackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 오디오 요소 생성
    audioRef.current = new Audio('/assets/background-music.mp3'); // 실제 음악 파일 경로로 수정 필요
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
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
  };

  return (
    <button
      onClick={toggleMusic}
      className="fixed bottom-8 left-8 bg-gray-600/80 hover:bg-gray-800/80 p-3 rounded-full transition-all duration-200 z-50 cursor-pointer"
    >
      {isPlaying ? (
        <Volume2 className="w-6 h-6 text-primary-600" />
      ) : (
        <VolumeX className="w-6 h-6 text-primary-600" />
      )}
    </button>
  );
};

export default BackgroundMusic;
