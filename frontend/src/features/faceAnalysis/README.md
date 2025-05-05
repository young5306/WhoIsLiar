# Face Analysis Module

이 모듈은 **face-api.js**와 **MediaPipe FaceMesh**를 결합하여 얼굴 감정(표정)과 생리적 지표(눈 깜빡임, 미세 움직임, 머리 회전)를 실시간으로 분석하고 시각화할 수 있도록 설계되었습니다. 다른 프로젝트에 그대로 가져다 붙여 사용할 수 있으며, 간단한 설정만으로 즉시 동작합니다.

---

## 1. 파일 구조

```
public/
└── models/                     # face-api.js 모델 파일 (weights_manifest + shards)
    ├─ tiny_face_detector_model-weights_manifest.json
    ├─ tiny_face_detector_model-shard1
    ├─ face_expression_model-weights_manifest.json
    ├─ face_expression_model-shard1
    ├─ face_landmark_68_model-weights_manifest.json
    └─ face_landmark_68_model-shard1

src/
└── features/
    └── faceAnalysis/          # 모듈 위치
        ├─ faceApi.ts          # face-api.js 감정 분석 서비스
        ├─ faceMesh.ts         # MediaPipe FaceMesh 지표 서비스
        ├─ index.ts            # export 편의 파일
        └─ FaceAnalysisDemo.tsx# 데모 컴포넌트

src/
├── App.tsx                    # Demo 호출 예시
├── main.tsx                   # React 진입점
└── ...
```

---

## 2. 의존성 설치

프로젝트 루트( `package.json` 위치)에서 다음 명령을 실행합니다:

```bash
npm install face-api.js \
            "@mediapipe/face_mesh" \
            "@mediapipe/camera_utils" \
            "@mediapipe/drawing_utils"
```

절대 경로 별칭을 사용하려면 추가로:

```bash
npm install -D typescript vite-tsconfig-paths
```

---

## 3. 모델 파일 복사

기존 `public/models` 폴더 전체를 새 프로젝트의 `public/models` 경로에 그대로 복사합니다. 모델 파일이 누락되면 `loadFromUri` 시 404 에러가 발생합니다.

---

## 4. TypeScript 설정 (tsconfig.json)

프로젝트 루트에 `tsconfig.json` 파일을 생성하거나 수정합니다:

```jsonc
{
  "compilerOptions": {
    "target": "es6",
    "module": "esnext",
    "lib": ["dom","es6","es2017.object","es2017.promise"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "features/*": ["src/features/*"]
    }
  },
  "include": ["src"]
}
```

* **baseUrl**: 절대 경로의 기준을 루트로 설정
* **paths**: `features/faceAnalysis` 모듈을 `src/features/faceAnalysis`로 매핑

---

## 5. Vite 설정 (vite.config.ts)

루트에 `vite.config.ts` 또는 `vite.config.js`를 생성/수정합니다:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      // 필요시 추가 별칭
      // 'features': path.resolve(__dirname, 'src/features')
    }
  }
});
```

* **vite-tsconfig-paths** 플러그인이 `tsconfig.json`의 `paths`를 자동으로 반영합니다.

---

## 6. 데모 컴포넌트 호출

`src/App.tsx`에 다음과 같이 추가하여 데모를 실행합니다:

```tsx
import React from 'react';
import FaceAnalysisDemo from 'features/faceAnalysis/FaceAnalysisDemo';

export default function App() {
  return <FaceAnalysisDemo />;
}
```

브라우저에서 `npm run dev` 후 `localhost:5173` (기본 포트)로 접속하면, 실시간 카메라 피드와 함께 감정·행동 지표가 표시됩니다.

---

## 7. 서비스 API

### FaceApiService (faceApi.ts)

* **loadModels(modelUrl: string): Promise<void>**

    * `/models` 경로에 위치한 face-api.js 모델을 로드
* **detectExpressions(video: HTMLVideoElement): Promise\<FaceApiResult | null>**

    * 단일 프레임에서 표정 확률 계산
    * `FaceApiResult.expressions`: 7가지 감정 확률
    * `FaceApiResult.topEmotion`: 최고 확률 감정 및 수치

### FaceMeshService (faceMesh.ts)

생성자 인자로 `(videoElement, onMetrics: (m: FaceMeshMetrics)→void)`를 받습니다.

* **start(): void**

    * 카메라 스트림을 FaceMesh에 연결하고, 각 프레임마다 지표를 계산
* `onMetrics` 콜백에 `FaceMeshMetrics` 전달:

    * `blinkRate`: 초당 깜빡임 횟수
    * `microMovements`: 눈썹·입꼬리 움직임 강도
    * `headPose`: yaw, pitch, roll (도 단위 평균)

---

## 8. 커스터마이징

* **모델 경로**: `faceApi.ts` 내 `loadModels` 호출 시 다른 URL을 지정 가능
* **감정 목록 추가**: `Emotion` 타입 확장 후, `faceExpressionNet` 대신 다른 모델도 로드
* **지표 지표 변경**: `faceMesh.ts`에서 Blink threshold, Head Pose 계산 방식 등을 조정

---

위 과정을 차례대로 진행하면, 특별한 수정 없이 바로 **심리 추리 게임**에 필요한 얼굴 분석 모듈을 통합하고 테스트할 수 있습니다. 문제가 발생하면 설정 파일(`tsconfig.json`, `vite.config.ts`)과 경로를 다시 한 번 확인해 주세요.
