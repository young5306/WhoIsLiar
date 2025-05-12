import { StreamManager } from 'openvidu-browser';

export interface SttResult {
  text: string;
  isFinal: boolean;
  speaker: string;
}

class SttService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback: ((result: SttResult) => void) | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;

  constructor() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window.SpeechRecognition ||
        window.webkitSpeechRecognition) as any;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'ko-KR';

      this.recognition.onresult = (event: any) => {
        console.log('Speech recognition result:', event);
        if (this.onResultCallback) {
          const result = event.results[event.results.length - 1];
          const text = result[0].transcript;
          const isFinal = result.isFinal;

          this.onResultCallback({
            text,
            isFinal,
            speaker: 'current',
          });
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          this.start(this.onResultCallback!);
        }
      };

      this.recognition.onstart = () => {
        console.log('Speech recognition started');
      };
    } else {
      console.error('Speech Recognition is not supported in this browser');
    }
  }

  public start(onResult: (result: SttResult) => void) {
    if (!this.recognition) {
      console.error('Speech recognition is not supported');
      return;
    }

    this.onResultCallback = onResult;
    this.isListening = true;
    try {
      this.recognition.start();
      console.log('STT started successfully');
    } catch (error) {
      console.error('Error starting STT:', error);
    }
  }

  public stop() {
    console.log('Stopping STT...');
    if (!this.recognition) return;

    this.isListening = false;
    try {
      this.recognition.stop();
      console.log('STT stopped successfully');
    } catch (error) {
      console.error('Error stopping STT:', error);
    }
    this.onResultCallback = null;

    // 오디오 컨텍스트 정리
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  public processStreamAudio(
    streamManager: StreamManager,
    onResult: (result: SttResult) => void
  ) {
    console.log('Processing stream audio...');
    const audioTrack = streamManager.stream
      .getMediaStream()
      .getAudioTracks()[0];
    if (!audioTrack) {
      console.error('No audio track found in stream');
      return;
    }

    try {
      // Web Audio API를 사용하여 오디오 스트림 처리
      this.audioContext = new AudioContext();
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(
        streamManager.stream.getMediaStream()
      );

      // 오디오 분석기 생성
      const analyser = this.audioContext.createAnalyser();
      this.mediaStreamSource.connect(analyser);

      // 오디오 데이터 처리
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const processAudio = () => {
        if (!this.isListening) return;

        analyser.getByteFrequencyData(dataArray);

        // 오디오 레벨이 특정 임계값을 넘으면 STT 시작
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        if (average > 50) {
          // 임계값 조정 가능
          console.log('Audio level threshold reached:', average);
          this.start(onResult);
        }

        requestAnimationFrame(processAudio);
      };

      processAudio();
      console.log('Audio processing started');
    } catch (error) {
      console.error('Error processing audio stream:', error);
    }
  }
}

export const sttService = new SttService();
