import { useRef, useEffect, useState } from 'react';
import {
  // loadModels,
  detectExpressions,
  Emotion,
  EMOTION_STYLE,
  FaceApiResult,
} from '../../services/api/FaceApiService';
import { StreamManager } from 'openvidu-browser';
import { isFaceApiModelLoaded } from '../../services/api/FaceApiService';

interface EmotionLogProps {
  streamManager: StreamManager;
  name?: string;
}

const EmotionLog: React.FC<EmotionLogProps> = ({
  streamManager,
  // name = '참가자',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [emotionResult, setEmotionResult] = useState<FaceApiResult | null>(
    null
  );
  const [currentEmotion, setCurrentEmotion] = useState<Emotion | null>(null);
  const [emotionStartTime, setEmotionStartTime] = useState<number | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const logContainerRef = useRef<HTMLDivElement>(null); // 로그 영역 DOM 참조
  const [emotionLog, setEmotionLog] = useState<string[]>([]);
  const [topEmotions, setTopEmotions] = useState<[Emotion, number][]>([]);
  const [highlighting, setHighlighting] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!videoRef.current || !streamManager?.stream?.getMediaStream) return;

      // await loadModels('/models');

      const mediaStream = streamManager.stream.getMediaStream();
      videoRef.current.srcObject = mediaStream;

      await videoRef.current.play();

      if (isFaceApiModelLoaded()) {
        setIsReady(true);
      }

      // const detectLoop = async () => {
      //   if (videoRef.current) {
      //     const res = await detectExpressions(videoRef.current);
      //     setEmotionResult(res);
      //   }
      //   requestAnimationFrame(detectLoop);
      // };

      // detectLoop();
    };

    setTimeout(init, 100);
    // init();

    // clean up (unmount)
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop()); // 웹캠 사용 종료
      }
    };
  }, [streamManager]);

  useEffect(() => {
    if (!isReady || !videoRef.current) return;

    const interval = setInterval(async () => {
      // ! => non-null assertion operator
      const res = await detectExpressions(videoRef.current!);
      if (res) {
        setEmotionResult(res);
      }
    }, 1000); // 1.5초

    return () => clearInterval(interval);
  }, [isReady]);

  useEffect(() => {
    if (!emotionResult) return;

    const { emotion, probability: _ } = emotionResult.topEmotion;
    const now = Date.now();

    // 감정이 변경되었을 때
    if (emotion !== currentEmotion) {
      setCurrentEmotion(emotion); // 현재 감정 상태 업데이트
      setEmotionStartTime(now); // 감정이 시작된 시간 기록
      setAlertMessage(null); // 이전 알림 메시지 초기화
    }

    // 감정이 지속되고 있을 때
    if (currentEmotion && emotion === currentEmotion) {
      const duration = now - (emotionStartTime ?? now); // 감정 지속 시간 계산

      // 감정이 10초 이상 지속되면 알림 메시지 설정
      if (duration >= 10000 && !alertMessage) {
        setAlertMessage(
          `${EMOTION_STYLE[emotion].emoji} ${EMOTION_STYLE[emotion].label}`
        );
      }
    }
  }, [emotionResult, currentEmotion, emotionStartTime, alertMessage]);

  useEffect(() => {
    if (
      emotionResult &&
      emotionResult.topEmotion.emotion !== 'neutral' &&
      emotionResult.topEmotion.emotion !== currentEmotion
    ) {
      const time = new Date().toLocaleTimeString(); // 현재 시간
      const log = `[${time}] ${
        EMOTION_STYLE[emotionResult.topEmotion.emotion].emoji
      } ${EMOTION_STYLE[emotionResult.topEmotion.emotion].label}`;

      // 중복 방지 및 강조 처리
      setEmotionLog((prev) => {
        if (prev[prev.length - 1] === log) return prev;
        setHighlighting(log);
        return [...prev, log];
      });
    }
  }, [emotionResult]);

  useEffect(() => {
    const emotionCounts: Record<Emotion, number> = {
      happy: 0,
      surprised: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      neutral: 0,
    };

    emotionLog.forEach((log) => {
      const match = log.match(/ (\p{Emoji_Presentation})/u);
      if (!match) return;

      const emoji = match[1];
      const emotion = Object.entries(EMOTION_STYLE).find(
        ([, value]) => value.emoji === emoji
      )?.[0] as Emotion;

      if (emotion) {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      }
    });

    const sorted = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2) as [Emotion, number][];

    setTopEmotions(sorted);
  }, [emotionLog]);

  useEffect(() => {
    if (highlighting) {
      const timer = setTimeout(() => setHighlighting(null), 1300);
      return () => clearTimeout(timer);
    }
  }, [highlighting]);

  return (
    <div className="flex gap-4">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          display: 'none',
        }}
      />
      <div className="w-[190px]"></div>
      <div className="max-h-[170px] min-h-[160px] w-[152px] min-w-[152px] rounded-xl px-2 py-1 bg-[#320000] text-red-600 flex">
        {!isReady ? (
          <p className="flex justify-center items-center">👀 Loading...</p>
        ) : (
          <>
            <div className="mt-2">
              {/* <h3>Expression</h3> */}
              {emotionResult ? (
                <ul>
                  <li>
                    {/* Top Emotion:{' '} */}
                    <strong
                      style={{
                        color:
                          EMOTION_STYLE[emotionResult.topEmotion.emotion].color,
                      }}
                    >
                      {EMOTION_STYLE[emotionResult.topEmotion.emotion].emoji}{' '}
                      {EMOTION_STYLE[emotionResult.topEmotion.emotion].label}
                    </strong>{' '}
                    ({(emotionResult.topEmotion.probability * 100).toFixed(1)}
                    %)
                  </li>
                </ul>
              ) : (
                <p>Detecting...</p>
              )}

              <div className="flex flex-row items-center gap-2 mt-2">
                {/* <h3 className="text-sm font-bold bg-red-200/80 w-[90px] rounded-2xl p-1">
                  📝 감정 기록
                </h3> */}

                {topEmotions.length > 0 && (
                  <div className="text-[13px] text-gray-700 mb-2">
                    {topEmotions.map(([emotion, count]) => (
                      <span
                        key={emotion}
                        className="mr-2"
                        style={{ color: `${EMOTION_STYLE[emotion].color}` }}
                      >
                        {EMOTION_STYLE[emotion].emoji}{' '}
                        {EMOTION_STYLE[emotion].label} {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-full max-h-[70px] min-h-[70px] min-w-[136px] rounded-xl p-2 bg-white border">
                <div
                  ref={logContainerRef}
                  className="w-full max-h-[50px] rounded-xl px-2 py-1 bg-white overflow-y-auto"
                >
                  {emotionLog.length === 0 ? (
                    <p className="text-xs text-gray-500">기록 없음</p>
                  ) : (
                    <ul className="text-[10px] space-y-1">
                      {[...emotionLog].reverse().map((log, idx) => (
                        <li
                          key={idx}
                          className={`transition-all duration-400 ${
                            log === highlighting
                              ? 'bg-amber-100 animate-bounce'
                              : ''
                          }`}
                        >
                          {log}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmotionLog;
