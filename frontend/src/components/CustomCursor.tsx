import { useEffect, useRef } from 'react';
import AnimatedCursor from 'react-animated-cursor';

const CustomCursor = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 오디오 요소 생성 및 설정
    const audio = new Audio('/cursors/click-sound.mp3');
    audio.preload = 'auto'; // 오디오 미리 로드
    audio.volume = 0.3;

    // 오디오 로드 완료 시 처리
    audio.addEventListener('canplaythrough', () => {
      audioRef.current = audio;
    });

    // 클릭 이벤트 리스너 추가
    const handleClick = () => {
      if (audioRef.current) {
        // 현재 재생 중인 오디오가 있다면 중지
        audioRef.current.pause();
        audioRef.current.currentTime = 0;

        // 새로 재생 시도
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log('Audio play failed:', error);
          });
        }
      }
    };

    // 시스템 커서 숨기기
    document.body.style.cursor = 'none';
    document.querySelectorAll('*').forEach((element) => {
      (element as HTMLElement).style.cursor = 'none';
    });

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // 컴포넌트 언마운트 시 커서 스타일 제거
      document.body.style.cursor = 'auto';
      document.querySelectorAll('*').forEach((element) => {
        (element as HTMLElement).style.cursor = 'auto';
      });
    };
  }, []);

  return (
    <AnimatedCursor
      innerSize={48}
      outerSize={48}
      innerScale={1}
      outerScale={1}
      innerStyle={{
        backgroundImage: 'url(/cursors/default2.png)',
        backgroundSize: 'contain',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        width: '48px',
        height: '48px',
        mixBlendMode: 'normal',
        pointerEvents: 'none',
        position: 'fixed',
        zIndex: 9999,
        transition: 'none',
        backgroundColor: 'transparent',
        transform: 'translate(-10%, -10%)',
      }}
      outerStyle={{
        backgroundImage: 'url(/cursors/pointer.png)',
        backgroundSize: 'contain',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        width: '48px',
        height: '48px',
        mixBlendMode: 'normal',
        pointerEvents: 'none',
        position: 'fixed',
        zIndex: 9999,
        transition: 'none',
        backgroundColor: 'transparent',
        transform: 'translate(-10%, -10%)',
      }}
      trailingSpeed={0}
      color="transparent"
      showSystemCursor={false}
    />
  );
};

export default CustomCursor;
