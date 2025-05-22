# STT Feature Module — Customization Guide

`features/stt` 폴더 하나로 프로젝트에 음성 인식 기능을 추가할 수 있습니다. 이 문서는 **기본 구조** 위에 각 요소를 **내 프로젝트에 맞게 확장**하고 **커스텀**하는 방법을 설명합니다.

---

## 1. 설치 및 기본 구조

1. `src/features/stt` 전체를 복사  
2. `src/global.d.ts` 파일(SpeechRecognition 전역 타입 선언)을 `src/` 최상단에 복사  
3. `SttProvider`를 앱 최상단에 래핑  
4. 원하는 컴포넌트에서 `useSttContext()`, `<SttButton/>`, `<Transcript/>` 사용

```

src/
├── global.d.ts
└── features/
└── stt/
├── hooks/
│   └── useSpeechRecognition.ts
├── context/
│   └── SttProvider.tsx
├── components/
│   ├── SttButton.tsx
│   └── Transcript.tsx
└── index.ts

````

---

## 2. Hook 확장하기 (`useSpeechRecognition.ts`)

### 기본 훅 시그니처
```ts
export function useSpeechRecognition(): {
  transcript: string;
  listening: boolean;
  start(): void;
  stop(): void;
}
````

### 옵션 추가

```ts
interface SpeechConfig {
  lang?: string;
  interimResults?: boolean;
  continuous?: boolean;
  onStart?(): void;
  onError?(e: any): void;
  onFinal?(text: string): void;
}

export function useSpeechRecognition(config: SpeechConfig = {}) {
  // 기본값 설정
  const {
    lang = 'ko-KR',
    interimResults = true,
    continuous = true,
    onStart,
    onError,
    onFinal
  } = config;

  // …기존 로직…

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = lang;
    recog.interimResults = interimResults;
    recog.continuous = continuous;

    recog.onstart = () => onStart?.();
    recog.onerror = err => {
      onError?.(err);
      setListening(false);
    };
    recog.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i][0];
        if (e.results[i].isFinal) final += r.transcript;
        else interim += r.transcript;
      }
      const text = interimResults ? interim : final;
      setTranscript(text);
      if (final) onFinal?.(final);
    };
    // …
  }, [lang, interimResults, continuous, onStart, onError, onFinal]);
}
```

* `lang`, `interimResults`, `continuous` 등 인식 옵션 조절
* 이벤트 훅(`onStart`, `onError`, `onFinal`)을 통해 외부 로직과 연동 가능

---

## 3. Context Provider 조정 (`SttProvider.tsx`)

* 기본 Provider는 내부 훅을 통째로 감쌉니다.
* **커스텀 Provider**를 만들어 옵션을 넘길 수 있습니다.

```tsx
interface ProviderProps {
  children: ReactNode;
  config?: SpeechConfig;
}

export function CustomSttProvider({ children, config }: ProviderProps) {
  const { transcript, listening, start, stop } = useSpeechRecognition(config);
  return (
    <SttContext.Provider value={{ transcript, listening, start, stop }}>
      {children}
    </SttContext.Provider>
  );
}
```

* `config`를 넘겨 언어, 이벤트 핸들러 등을 제어
* 앱 전체가 아닌 특정 섹션에만 적용하고 싶을 때 유용

---

## 4. UI 컴포넌트 커스터마이징

### 4.1 `<SttButton/>`

기본:

```tsx
export const SttButton: React.FC = () => {
  const { listening, start, stop } = useSttContext();
  return (
    <button onClick={listening ? stop : start}>
      {listening ? '중지' : '시작'}
    </button>
  );
};
```

#### Props 추가 예시

```tsx
interface ButtonProps {
  startLabel?: string;
  stopLabel?: string;
  className?: string;
}

export const SttButton: React.FC<ButtonProps> = ({
  startLabel = '시작',
  stopLabel = '중지',
  className
}) => {
  const { listening, start, stop } = useSttContext();
  return (
    <button className={className} onClick={listening ? stop : start}>
      {listening ? stopLabel : startLabel}
    </button>
  );
};
```

* `startLabel`, `stopLabel`로 버튼 텍스트 커스터마이징
* `className`을 받아 Tailwind, CSS 모듈 등 적용 가능

### 4.2 `<Transcript/>`

기본:

```tsx
export const Transcript: React.FC = () => {
  const { transcript } = useSttContext();
  return <div>{transcript || '대기 중...'}</div>;
};
```

#### Props 추가 예시

```tsx
interface TranscriptProps {
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Transcript: React.FC<TranscriptProps> = ({
  placeholder = '대기 중...',
  className,
  style
}) => {
  const { transcript } = useSttContext();
  return (
    <div className={className} style={style}>
      {transcript || placeholder}
    </div>
  );
};
```

* `placeholder`, `className`, `style`로 외관·문구 조정 가능

---

## 5. 글로벌 타입 선언 커스터마이징

* `global.d.ts`에 추가 이벤트 타입이나 `maxAlternatives` 등 속성을 선언할 수 있습니다.

```ts
declare global {
  class SpeechRecognition extends EventTarget {
    maxAlternatives: number;
    // …기타 속성 추가…
  }
}
```

* TS가 제공하지 않는 최신 Web Speech API 속성도 여기에 정의

---

## 6. 예제: 영어·최종 결과만 표시

```tsx
// App.tsx
import React from 'react';
import { CustomSttProvider, SttButton, Transcript } from './features/stt';

function App() {
  return (
    <CustomSttProvider
      config={{
        lang: 'en-US',
        interimResults: false,
        continuous: false,
        onFinal: text => console.log('Final:', text),
      }}
    >
      <SttButton startLabel="Start" stopLabel="Stop" className="btn" />
      <Transcript placeholder="Say something..." className="transcript" />
    </CustomSttProvider>
  );
}
export default App;
```

* `lang`을 `'en-US'`로 변경
* `interimResults: false`로 중간 결과 무시
* `onFinal` 콜백으로 최종 텍스트 처리
* 버튼 레이블(`startLabel`, `stopLabel`)과 CSS 클래스(`btn`, `transcript`) 지정

---

## 7. 요약

1. **Hook**에 옵션과 이벤트 핸들러 추가 → 세밀한 동작 제어
2. **Provider**를 감싸는 방식으로 범위 지정 및 설정 전달
3. **UI 컴포넌트**에 `props`를 추가 → 텍스트·스타일·클래스 직접 변경
4. **global.d.ts**에 속성·이벤트 정의 확장
5. **사용 예시**를 참고해 프로젝트에 맞게 조합

이 가이드만 있으면 `features/stt` 모듈을 그대로 가져와서 **언제든 자유롭게 확장·커스터마이징**하여 사용할 수 있습니다.\`\`\`
