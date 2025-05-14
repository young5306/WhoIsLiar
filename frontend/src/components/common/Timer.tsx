import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  onTimeEnd?: () => void;
  size?: 'small' | 'medium' | 'large';
  onMount?: () => void;
}

export interface TimerRef {
  startTimer: (seconds: number) => void;
  pauseTimer: () => void;
}

const Timer = forwardRef<TimerRef, TimerProps>(
  ({ onTimeEnd, size = 'medium', onMount }, ref) => {
    const [timeLeft, setTimeLeft] = React.useState(0);
    const timerRef = useRef<number>();
    const initialTime = useRef(0);

    useEffect(() => {
      onMount?.();
    }, [onMount]);

    const sizeClasses = {
      small: {
        container: 'w-16 h-16',
        text: 'text-lg',
      },
      medium: {
        container: 'w-24 h-24',
        text: 'text-2xl',
      },
      large: {
        container: 'w-32 h-32',
        text: 'text-3xl',
      },
    };

    const currentSize = sizeClasses[size];

    useImperativeHandle(ref, () => ({
      startTimer: (seconds: number) => {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
        }
        initialTime.current = seconds;
        setTimeLeft(seconds);

        timerRef.current = window.setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              window.clearInterval(timerRef.current);
              onTimeEnd?.();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      },
      pauseTimer: () => {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = undefined;
        }
      },
    }));

    const progress = (timeLeft / initialTime.current) * 100;
    const circumference = 2 * Math.PI * 40; // 반지름 40px 기준
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // 3초 이하일 때 빨간색, 그 외에는 초록색
    const gradientColors =
      timeLeft <= 3
        ? {
            start: '#EF4444', // 빨간색
            end: '#F87171', // 밝은 빨간색
          }
        : {
            start: '#22C55E', // 초록색
            end: '#4ADE80', // 밝은 초록색
          };

    return (
      <div
        className={`relative ${currentSize.container} flex items-center justify-center`}
      >
        {/* 배경 원 */}
        <svg className="absolute w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="40"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="40"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5 }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <motion.stop
                offset="0%"
                stopColor={gradientColors.start}
                animate={{ stopColor: gradientColors.start }}
                transition={{ duration: 0.5 }}
              />
              <motion.stop
                offset="100%"
                stopColor={gradientColors.end}
                animate={{ stopColor: gradientColors.end }}
                transition={{ duration: 0.5 }}
              />
            </linearGradient>
          </defs>
        </svg>

        {/* 시간 표시 */}
        <motion.div
          key={timeLeft}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className={`${currentSize.text} font-bold text-white`}
        >
          {timeLeft}
        </motion.div>
      </div>
    );
  }
);

Timer.displayName = 'Timer';

export default Timer;
