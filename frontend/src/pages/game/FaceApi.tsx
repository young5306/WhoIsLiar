import { useRef, useEffect, useState } from 'react';
import {
  detectExpressions,
  FaceApiResult,
  isFaceApiModelLoaded,
} from '../../services/api/FaceApiService';
import { StreamManager } from 'openvidu-browser';
import useSocketStore from '../../stores/useSocketStore';

interface FaceApiEmotionProps {
  streamManager: StreamManager;
  name?: string;
  userIndex?: number;
  roomCode: string | null;
  isLogReady: boolean;
  setIsLogReady: (isLogReady: boolean) => void;
  onEmotionUpdate: (emotion: FaceApiResult) => void;
}

const FaceApiEmotion = ({
  streamManager,
  name,
  userIndex = 0,
  roomCode,
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
    console.log(`${name} 분석 코드로 넘어옴`);
  }, []);

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
        console.log(`${name} - 모델 준비 완료`);
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
    // 감정 분석을 시작하려면 비디오가 준비되어 있어야 하므로, 준비되지 않았으면 종료
    if (!isReady || !videoRef.current) {
      console.log(`${name} - 감정 분석 대기 중`, isReady);
      return;
    }

    // 분석 시작을 분산시키기 위해 0~600ms 사이 랜덤 지연 시간 생성
    const delay = 0;
    // const delay = userIndex * 200 + Math.random() * 300;
    console.log(`${name}의 분석 시작 Delay: ${delay.toFixed(0)}ms`);

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
          console.error(`${name} - 감정 분석 오류:`, error);
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

  useEffect(() => {
    if (!emotionResult?.expressions) return;

    onEmotionUpdate(emotionResult);
    console.log(`${name} - 감정 결과 전송`, isLogReady, emotionResult);

    // const emotionLog = {
    //   roomCode: roomCode || '',
    //   order: userIndex,
    //   userName: name || 'unknown',
    //   emotionResult: emotionResult,
    // };

    // sendEmotionLog(emotionLog);
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

// ================================================

// import { useRef, useEffect, useState } from 'react';
// import {
//   detectExpressions,
//   FaceApiResult,
//   isFaceApiModelLoaded,
// } from '../../services/api/FaceApiService';
// import { StreamManager } from 'openvidu-browser';

// interface FaceApiEmotionProps {
//   streamManager: StreamManager;
//   name?: string;
//   isLogReady: boolean;
//   setIsLogReady: (isLogReady: boolean) => void;
//   onEmotionUpdate: (emotion: FaceApiResult) => void;
// }

// const FaceApiEmotion = ({
//   streamManager,
//   name,
//   isLogReady,
//   setIsLogReady,
//   onEmotionUpdate,
// }: FaceApiEmotionProps) => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [emotionResult, setEmotionResult] = useState<FaceApiResult | null>(
//     null
//   );
//   const [isReady, setIsReady] = useState(false);

//   const pollingIntervalMs = 1000;

//   useEffect(() => {
//     const init = async () => {
//       if (!videoRef.current || !streamManager?.stream?.getMediaStream) return;

//       const mediaStream = streamManager.stream.getMediaStream();
//       videoRef.current.srcObject = mediaStream;

//       await videoRef.current.play().catch((error) => {
//         console.warn(`${name} - video play 실패:`, error);
//       });

//       if (isFaceApiModelLoaded()) {
//         setIsReady(true);
//         setIsLogReady(true);
//       }
//     };

//     setTimeout(init, 100);

//     // clean up (unmount)
//     return () => {
//       if (videoRef.current?.srcObject) {
//         (videoRef.current.srcObject as MediaStream)
//           .getTracks()
//           .forEach((t) => t.stop()); // 웹캠 사용 종료
//       }
//     };
//   }, [streamManager]);

//   // 유저별 감정분석 시작 딜레이 걸기 ==================================

//   useEffect(() => {
//     // 감정 분석을 시작하려면 비디오가 준비되어 있어야 하므로, 준비되지 않았으면 종료
//     if (!isReady || !videoRef.current) {
//       console.log(`${name} 은 여기까지 넘어옴`, isReady);
//     } else {
//       console.log(`${name} 은 여기까지 안넘어옴`, isReady);
//     }
//     // return;

//     // 분석 시작을 분산시키기 위해 0~600ms 사이 랜덤 지연 시간 생성
//     const delay = Math.random() * 600;
//     console.log(`${name}의 시작 Delay시간: `, delay);

//     // setInterval ID를 저장할 변수 선언 (나중에 정리 용도)
//     let intervalId: ReturnType<typeof setInterval>;

//     // 일정 시간(delay) 이후 감정 분석 주기적 실행 시작
//     const timeoutId = setTimeout(() => {
//       // 일정 주기로 감정 분석 실행
//       intervalId = setInterval(async () => {
//         try {
//           // 얼굴 감정 분석 수행
//           const res = await detectExpressions(videoRef.current!);

//           // 결과가 유효하면 상태 업데이트 (부모 컴포넌트로 전달됨)
//           if (res) {
//             setEmotionResult(res);
//           }
//         } catch (error) {
//           // 분석 중 오류 발생 시 로그 출력
//           console.error('감정 분석 오류:', error);
//         }
//       }, pollingIntervalMs);
//     }, delay);

//     // 컴포넌트 언마운트 시 또는 의존성 변경 시 리소스 정리
//     return () => {
//       // setTimeout이 아직 실행되지 않았다면 취소
//       clearTimeout(timeoutId);

//       // setInterval이 실행된 상태라면 분석 중지
//       clearInterval(intervalId);
//     };
//   }, [isReady]);

//   // ========================================

//   useEffect(() => {
//     if (!emotionResult) return;
//     if (emotionResult?.expressions) {
//       onEmotionUpdate(emotionResult);
//       console.log('emotionLog하위', isLogReady, emotionResult);
//     }
//   }, [emotionResult]);

//   return (
//     <video
//       ref={videoRef}
//       autoPlay
//       muted
//       playsInline
//       style={{
//         display: 'none',
//       }}
//     />
//   );
// };

// export default FaceApiEmotion;
