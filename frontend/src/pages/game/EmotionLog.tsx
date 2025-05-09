import { useEffect, useState } from 'react';
import {
  Emotion,
  EMOTION_STYLE,
  FaceApiResult,
} from '../../services/api/FaceApiService';

interface EmotionLogProps {
  name: string;
  isLogReady: boolean;
  emotion?: FaceApiResult;
}

const EmotionLog = ({ name, emotion, isLogReady }: EmotionLogProps) => {
  const [currentEmotion, _setCurrentEmotion] = useState<Emotion | null>(null);
  const [emotionLog, setEmotionLog] = useState<string[]>([]);
  const [topEmotions, setTopEmotions] = useState<[Emotion, number][]>([]);
  const [highlighting, setHighlighting] = useState<string | null>(null);

  const userName = name;
  const emotionResult = emotion;

  console.log('prop 결과', userName, emotionResult);
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
    <>
      <div className="w-[190px]"></div>
      <div className="max-h-[170px] min-h-[160px] w-[152px] min-w-[152px] rounded-xl px-2 py-1 bg-[#320000] text-red-600 flex">
        {!isLogReady ? (
          <p className="flex justify-center items-center">👀 Loading...</p>
        ) : (
          <>
            <div className="mt-2">
              {emotionResult ? (
                <ul>
                  <li>
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
                <div className="w-full max-h-[50px] rounded-xl px-2 py-1 bg-white overflow-y-auto">
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
    </>
  );
};

export default EmotionLog;
