import { useEffect, useState, useCallback, useRef } from 'react';

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState<string>('');
  const [listening, setListening] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition>();

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('이 브라우저는 SpeechRecognition을 지원하지 않습니다.');
      return;
    }
    const recog = new SpeechRecognition() as SpeechRecognition;
    recog.lang = 'ko-KR';
    recog.interimResults = true;
    recog.continuous = true;

    recog.onresult = (e: SpeechRecognitionEvent) => {
      const text = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      setTranscript(text);
    };
    recog.onerror = (err) => {
      console.error('SpeechRecognition error', err);
      setListening(false);
    };
    recognitionRef.current = recog;

    return () => {
      recog.stop();
    };
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript('');
    recognitionRef.current.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setListening(false);
  }, []);

  return { transcript, listening, start, stop };
}
