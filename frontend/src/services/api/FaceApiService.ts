import * as faceapi from 'face-api.js';

export type Emotion =
  | 'neutral' // 중립
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'disgusted'
  | 'surprised';

export type Expressions = {
  [key in Emotion]: number; // 감정 확률
};

export interface EmotionLogMessage {
  roomCode: string;
  order: number;
  userName: string;
  emotionResult: FaceApiResult;
}

export interface FaceApiResult {
  expressions: Expressions;
  topEmotion: { emotion: Emotion; probability: number };
}

let faceApiModelIsLoaded = false;

// face-api.js 얼굴 인식 모델 로드
export const loadModels = async (modelUrl: string): Promise<void> => {
  if (faceApiModelIsLoaded) return;

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl), // 얼굴 탐지 모델
    faceapi.nets.faceExpressionNet.loadFromUri(modelUrl), // 감정 예측 모델
    faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl), // 얼굴 랜드마크(얼굴 특정 지점) 모델
  ]);

  faceApiModelIsLoaded = true;
};

export function isFaceApiModelLoaded() {
  return faceApiModelIsLoaded;
}

// 감정 추출 함수
export const detectExpressions = async (
  video: HTMLVideoElement
): Promise<FaceApiResult | null> => {
  // detectSingleFace - 단일 얼굴 감지
  // withFaceLandmarks - 얼굴랜드마크 정보 추출
  // withFaceExpressions - 얼굴 감정 정보 추출

  if (!faceApiModelIsLoaded) {
    console.warn('감정 모델 미로드 상태에서 detect 호출됨');
    return null;
  }

  if (!video || video.readyState < 2) {
    console.warn('비디오 준비 안됨');
    return null;
  }

  try {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    // 얼굴 감지 실패시, null 반환
    if (!detection) return null;

    const expr = detection.expressions as Expressions;

    // Object.entries() - 객체 -> 배열 변환 함수
    const [emotion, probability] = (
      Object.entries(expr) as [Emotion, number][]
    ).sort((a, b) => b[1] - a[1])[0];

    return {
      expressions: expr,
      topEmotion: { emotion, probability },
    };
  } catch (err) {
    console.error('감정 분석 중 오류 발생:', err);
    return null;
  }
};

export const EMOTION_LABELS: Record<Emotion, string> = {
  angry: '화남',
  disgusted: '혐오',
  fearful: '두려움',
  happy: '행복',
  neutral: '중립',
  sad: '슬픔',
  surprised: '놀람',
};

export const EMOTION_STYLE: Record<
  Emotion,
  { label: string; emoji: string; color: string }
> = {
  angry: { label: '화남', emoji: '😠', color: '#e74c3c' },
  disgusted: { label: '혐오', emoji: '🤢', color: '#27ae60' },
  fearful: { label: '두려움', emoji: '😨', color: '#8e44ad' },
  happy: { label: '행복', emoji: '😄', color: '#f1c40f' },
  neutral: { label: '중립', emoji: '😐', color: '#95a5a6' },
  sad: { label: '슬픔', emoji: '😢', color: '#3498db' },
  surprised: { label: '놀람', emoji: '😲', color: '#e67e22' },
};
