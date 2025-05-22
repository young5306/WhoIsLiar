// src/global.d.ts
export {};  // ← 이 한 줄이 아주 중요합니다.

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  class SpeechRecognition extends EventTarget {
    constructor();
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    onresult: (e: SpeechRecognitionEvent) => void;
    onerror: (e: any) => void;
    start(): void;
    stop(): void;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly [index: number]: SpeechRecognitionAlternative;
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult | null;
  }
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }
}
