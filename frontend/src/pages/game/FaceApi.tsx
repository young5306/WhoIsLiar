import { useRef, useEffect, useState } from 'react';
import {
  detectExpressions,
  FaceApiResult,
} from '../../services/api/FaceApiService';
import { StreamManager } from 'openvidu-browser';
import { isFaceApiModelLoaded } from '../../services/api/FaceApiService';

interface FaceApiEmotionProps {
  streamManager: StreamManager;
  name: string;
  isLogReady: boolean;
  setIsLogReady: (isLogReady: boolean) => void;
  onEmotionUpdate: (emotion: FaceApiResult) => void;
}

const FaceApiEmotion = ({
  streamManager,
  name,
  isLogReady,
  setIsLogReady,
  onEmotionUpdate,
}: FaceApiEmotionProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [emotionResult, setEmotionResult] = useState<FaceApiResult | null>(
    null
  );
  const [isReady, setIsReady] = useState(false);

  const pollingIntervalMs = 1000;

  useEffect(() => {
    const init = async () => {
      if (!videoRef.current || !streamManager?.stream?.getMediaStream) return;

      const mediaStream = streamManager.stream.getMediaStream();
      videoRef.current.srcObject = mediaStream;

      await videoRef.current.play().catch((error) => {
        console.warn(`${name} - video play 실패:`, error);
      });

      if (isFaceApiModelLoaded()) {
        setIsReady(true);
        setIsLogReady(true);
      }
    };

    setTimeout(init, 100);

    // clean up (unmount)
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop()); // 웹캠 사용 종료
      }
    };
  }, [streamManager]);

  // 유저별 감정분석 시작 딜레이 걸기 ==================================

  useEffect(() => {
    // 감정 분석을 시작하려면 비디오가 준비되어 있어야 하므로, 준비되지 않았으면 종료
    if (!isReady || !videoRef.current) {
      console.log(`${name} 은 여기까지 넘어옴`, isReady);
    } else {
      console.log(`${name} 은 여기까지 안넘어옴`, isReady);
    }
    // return;

    // 분석 시작을 분산시키기 위해 0~600ms 사이 랜덤 지연 시간 생성
    const delay = Math.random() * 600;
    console.log(`${name}의 시작 Delay시간: `, delay);

    // setInterval ID를 저장할 변수 선언 (나중에 정리 용도)
    let intervalId: ReturnType<typeof setInterval>;

    // 일정 시간(delay) 이후 감정 분석 주기적 실행 시작
    const timeoutId = setTimeout(() => {
      // 일정 주기로 감정 분석 실행
      intervalId = setInterval(async () => {
        try {
          // 얼굴 감정 분석 수행
          const res = await detectExpressions(videoRef.current!);

          // 결과가 유효하면 상태 업데이트 (부모 컴포넌트로 전달됨)
          if (res) {
            setEmotionResult(res);
          }
        } catch (error) {
          // 분석 중 오류 발생 시 로그 출력
          console.error('감정 분석 오류:', error);
        }
      }, pollingIntervalMs);
    }, delay);

    // 컴포넌트 언마운트 시 또는 의존성 변경 시 리소스 정리
    return () => {
      // setTimeout이 아직 실행되지 않았다면 취소
      clearTimeout(timeoutId);

      // setInterval이 실행된 상태라면 분석 중지
      clearInterval(intervalId);
    };
  }, [isReady]);

  // ========================================

  useEffect(() => {
    if (!emotionResult) return;
    if (emotionResult?.expressions) {
      onEmotionUpdate(emotionResult);
      console.log('emotionLog하위', isLogReady, emotionResult);
    }
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
