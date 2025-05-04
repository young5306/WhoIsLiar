import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export interface FaceMeshMetrics {
  blinkRate: number; // 초당 깜빡임 횟수
  microMovements: number; // 입꼬리·눈썹 진동 강도
  headPose: {
    // 회전 각도(° 단위)
    yaw: number;
    pitch: number;
    roll: number;
  };
}

export class FaceMeshService {
  private faceMesh: FaceMesh;
  private frameCount = 0;
  private blinkCount = 0;
  private lastEAR = 0;
  private earThreshold = 0.2;
  private movementsSum = 0;
  private poseSum = { yaw: 0, pitch: 0, roll: 0 };

  constructor(
    private video: HTMLVideoElement,
    private onMetrics: (m: FaceMeshMetrics) => void
  ) {
    this.faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    this.faceMesh.onResults(this.onResults.bind(this));
  }

  /** 시작하면 자동으로 지표를 계산하여 callback 호출 */
  start() {
    new Camera(this.video, {
      onFrame: async () => await this.faceMesh.send({ image: this.video }),
      width: 720,
      height: 560,
    }).start();
  }

  private onResults(results: Results) {
    if (!results.multiFaceLandmarks) return;
    const landmarks = results.multiFaceLandmarks[0];
    this.frameCount++;

    // 1) EAR (Eye Aspect Ratio) 기반 깜빡임 검출
    const leftEye = landmarks.slice(33, 42); // Mediapipe 인덱스 기준
    const ear = this.computeEAR(leftEye);
    if (this.lastEAR > this.earThreshold && ear <= this.earThreshold) {
      this.blinkCount++;
    }
    this.lastEAR = ear;

    // 2) 입꼬리·눈썹 미세 동작 강도 (분산)
    const browY = (landmarks[70].y + landmarks[300].y) / 2; // 대략 눈썹
    const mouthY = (landmarks[13].y + landmarks[14].y) / 2; // 대략 입술 중간
    this.movementsSum += Math.abs(browY - mouthY);

    // 3) Head Pose 단순 추정 (yaw, pitch, roll)
    const nose = landmarks[1];
    const leftEyeCorner = landmarks[33];
    const rightEyeCorner = landmarks[263];
    const yaw = Math.atan2(
      rightEyeCorner.x - leftEyeCorner.x,
      results.image.width
    );
    const pitch = Math.atan2(
      nose.y - (leftEyeCorner.y + rightEyeCorner.y) / 2,
      results.image.height
    );
    const roll = Math.atan2(
      rightEyeCorner.y - leftEyeCorner.y,
      rightEyeCorner.x - leftEyeCorner.x
    );
    this.poseSum.yaw += yaw;
    this.poseSum.pitch += pitch;
    this.poseSum.roll += roll;

    // 1초 간격으로 metric 발행
    if (this.frameCount >= 30) {
      const seconds = this.frameCount / 30;
      const metrics: FaceMeshMetrics = {
        blinkRate: this.blinkCount / seconds,
        microMovements: this.movementsSum / this.frameCount,
        headPose: {
          yaw: (this.poseSum.yaw / this.frameCount) * (180 / Math.PI),
          pitch: (this.poseSum.pitch / this.frameCount) * (180 / Math.PI),
          roll: (this.poseSum.roll / this.frameCount) * (180 / Math.PI),
        },
      };
      this.onMetrics(metrics);
      // 초기화
      this.frameCount = 0;
      this.blinkCount = 0;
      this.movementsSum = 0;
      this.poseSum = { yaw: 0, pitch: 0, roll: 0 };
    }
  }

  /** EAR = (‖p2-p6‖ + ‖p3-p5‖) / (2 * ‖p1-p4‖) */
  private computeEAR(eye: { x: number; y: number }[]): number {
    const dist = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);
    return (
      (dist(eye[1], eye[5]) + dist(eye[2], eye[4])) / (2 * dist(eye[0], eye[3]))
    );
  }
}
