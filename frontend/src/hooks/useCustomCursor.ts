import { useEffect } from 'react';

const useCustomCursor = () => {
  useEffect(() => {
    // 클릭 효과음 생성
    const clickSound = new Audio('/assets/sounds/click.mp3');
    clickSound.volume = 0.3; // 볼륨 조절

    // 클릭 이벤트 핸들러
    const handleClick = (e: MouseEvent) => {
      // 클릭 효과음 재생
      clickSound.currentTime = 0;
      clickSound.play().catch((err) => console.log('Audio play failed:', err));

      // 커서 애니메이션을 위한 임시 요소 생성
      const cursor = document.createElement('div');
      cursor.className = 'cursor-click';
      cursor.style.position = 'fixed';
      cursor.style.pointerEvents = 'none';
      cursor.style.zIndex = '9999';
      cursor.style.width = '32px';
      cursor.style.height = '32px';
      cursor.style.background =
        'url(/assets/cursors/click.png) no-repeat center center';
      cursor.style.backgroundSize = 'contain';
      cursor.style.left = `${e.clientX - 16}px`;
      cursor.style.top = `${e.clientY - 16}px`;

      document.body.appendChild(cursor);

      // 애니메이션 종료 후 요소 제거
      setTimeout(() => {
        document.body.removeChild(cursor);
      }, 200);
    };

    // 이벤트 리스너 등록
    document.addEventListener('click', handleClick);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);
};

export default useCustomCursor;
