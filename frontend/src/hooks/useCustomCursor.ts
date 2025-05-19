import { useEffect } from 'react';

const useCustomCursor = () => {
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const cursor = document.createElement('div');
      cursor.className = 'cursor-click';
      cursor.style.position = 'fixed';
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      cursor.style.pointerEvents = 'none';
      cursor.style.zIndex = '9999';
      document.body.appendChild(cursor);

      setTimeout(() => {
        cursor.remove();
      }, 200);
    };

    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
};

export default useCustomCursor;
