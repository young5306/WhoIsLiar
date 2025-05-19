import { useRef, useEffect, useState } from 'react';
import {
  detectExpressions,
  FaceApiResult,
  isFaceApiModelLoaded,
} from '../../services/api/FaceApiService';
import { StreamManager } from 'openvidu-browser';
import { useWebSocketContext } from '../../contexts/WebSocketProvider';

interface FaceApiEmotionProps {
  streamManager: StreamManager;
  name?: string;
  userIndex?: number;
  roomCode: string | null;
  isLogReady: boolean;
  setIsLogReady: (isLogReady: boolean) => void;
  onEmotionUpdate: (emotion: FaceApiResult | null) => void;
}

const FaceApiEmotion = ({
  streamManager,
  name,
  userIndex = 0,
  roomCode,
  // isLogReady,
  setIsLogReady,
  onEmotionUpdate,
}: FaceApiEmotionProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [emotionResult, setEmotionResult] = useState<FaceApiResult | null>(
    null
  );
  const [isReady, setIsReady] = useState(false);
  const { sendEmotion: emotionSend, isConnected } = useWebSocketContext();

  const pollingIntervalMs = 1000;

  const waitForModelReady = async (retry = 10) => {
    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(() => {
        if (isFaceApiModelLoaded()) {
          clearInterval(interval);
          resolve();
        } else if (retry-- <= 0) {
          clearInterval(interval);
          reject(`${name} - FaceAPI 모델 로딩 실패`);
        }
      }, 200);
    });
  };

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    let initialized = false;

    const continueInit = async () => {
      if (
        initialized ||
        !videoRef.current ||
        typeof streamManager?.stream?.getMediaStream !== 'function'
      )
        return;
      initialized = true;

      const mediaStream = streamManager.stream.getMediaStream();
      videoRef.current.srcObject = mediaStream;

      try {
        await videoRef.current.play();
      } catch (error) {
        console.warn(`${name} - video play 실패:`, error);
      }

      try {
        await waitForModelReady();
        setIsReady(true);
        setIsLogReady(true);
        // console.log(`${name} - 모델 준비 완료`);
      } catch (err) {
        console.warn(`${name} - 모델 아직 로드 안됨`, err);
      }
    };

    const init = () => {
      if (
        !videoRef.current ||
        typeof streamManager?.stream?.getMediaStream !== 'function'
      ) {
        console.warn(`${name} - 비디오 또는 스트림이 준비되지 않음`);

        checkInterval = setInterval(() => {
          if (
            videoRef.current &&
            typeof streamManager?.stream?.getMediaStream === 'function'
          ) {
            clearInterval(checkInterval);
            continueInit();
          }
        }, 100);
      } else {
        continueInit();
      }
    };

    setTimeout(init, 100);

    return () => {
      if (checkInterval) clearInterval(checkInterval);

      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, [streamManager]);

  useEffect(() => {
    if (!isReady || !videoRef.current) {
      // console.log(`${name} - 감정 분석 대기 중`, isReady);
      return;
    }

    const delay = 0;
    // const delay = userIndex * 200 + Math.random() * 300; // 부하 분산 필요할 경우 활성화
    // console.log(`${name}의 분석 시작 Delay: ${delay.toFixed(0)}ms`);

    let intervalId: ReturnType<typeof setInterval>;

    const timeoutId = setTimeout(() => {
      intervalId = setInterval(async () => {
        try {
          const res = await detectExpressions(videoRef.current!);

          if (res) {
            setEmotionResult(res);
          } else {
            setEmotionResult(null);
          }
        } catch (error) {
          console.error(`${name} - 감정 분석 오류:`, error);
        }
      }, pollingIntervalMs);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isReady]);

  useEffect(() => {
    if (!emotionResult?.expressions) {
      onEmotionUpdate(null);
    } else {
      onEmotionUpdate(emotionResult);
    }

    // if (!emotionResult?.expressions) return;

    // onEmotionUpdate(emotionResult);
    // console.log(`${name} - 감정 결과 전송`, isLogReady, emotionResult);

    if (!isConnected) {
      console.warn('WebSocket이 연결되지 않았습니다.');
      return;
    }

    const emotionLog = {
      type: 'socketEmotionLog',
      roomCode: roomCode || '',
      order: userIndex,
      userName: name || 'unknown',
      emotionResult: emotionResult,
    };

    emotionSend(emotionLog);
    // console.log(`🔄 ${name} 감정 로그 웹소켓 전송:`, emotionLog);
  }, [emotionResult]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      style={{
        display: 'none',
      }}
    />
  );
};

export default FaceApiEmotion;
