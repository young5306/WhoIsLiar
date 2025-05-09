import { useRef, useEffect, useState } from 'react';
import {
  detectExpressions,
  FaceApiResult,
} from '../../services/api/FaceApiService';
import { StreamManager } from 'openvidu-browser';
import { isFaceApiModelLoaded } from '../../services/api/FaceApiService';

interface FaceApiEmotionProps {
  streamManager: StreamManager;
  name?: string;
  isLogReady: boolean;
  setIsLogReady: (isLogReady: boolean) => void;
  onEmotionUpdate: (emotion: FaceApiResult) => void;
}

const FaceApiEmotion = ({
  streamManager,
  onEmotionUpdate,
  isLogReady,
  setIsLogReady,
}: FaceApiEmotionProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [emotionResult, setEmotionResult] = useState<FaceApiResult | null>(
    null
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!videoRef.current || !streamManager?.stream?.getMediaStream) return;

      const mediaStream = streamManager.stream.getMediaStream();
      videoRef.current.srcObject = mediaStream;

      await videoRef.current.play();

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

  useEffect(() => {
    if (!isReady || !videoRef.current) return;

    const interval = setInterval(async () => {
      const res = await detectExpressions(videoRef.current!);
      if (res) {
        setEmotionResult(res);
      }
    }, 1000); // 1초

    return () => clearInterval(interval);
  }, [isReady]);

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
