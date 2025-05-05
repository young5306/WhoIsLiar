import * as faceapi from 'face-api.js';

export type Emotion =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'disgusted'
  | 'surprised';

export type Expressions = {
  [key in Emotion]: number;
};

export interface FaceApiResult {
  expressions: Expressions;
  topEmotion: { emotion: Emotion; probability: number };
}

export class FaceApiService {
  /** 모델 파일 로드 */
  static async loadModels(modelUrl: string): Promise<void> {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
      faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
    ]);
  }

  /** 단일 프레임에서 감정 추출 */
  static async detectExpressions(
    video: HTMLVideoElement
  ): Promise<FaceApiResult | null> {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();
    if (!detection) return null;

    const expr = detection.expressions as Expressions;
    // 최고 확률 감정 선택
    const [emotion, probability] = (Object.entries(expr) as [Emotion, number][]) // 타입 단언
      .sort((a, b) => b[1] - a[1])[0];

    return {
      expressions: expr,
      topEmotion: { emotion, probability },
    };
  }
}
