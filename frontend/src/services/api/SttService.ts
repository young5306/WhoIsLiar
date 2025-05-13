import { StreamManager } from 'openvidu-browser';
import { api } from './Api';

export interface SttResult {
  text: string;
  isFinal: boolean;
  speaker: string;
}

export interface HintMessage {
  sender: string;
  content: string;
}

// 타입 정의 추가
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

class SttService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback: ((result: SttResult) => void) | null = null;
  private currentSpeakingPlayer: string | null = null;
  private myUserName: string | null = null; // 내 이름 저장
  private accumulatedText: string = '';
  private recordingTimeout: NodeJS.Timeout | null = null;
  private maxRecordingTime: number = 20000; // 20 seconds in milliseconds
  private hasRecognizedSpeech: boolean = false; // 음성이 인식되었는지 추적하는 플래그
  private lastRecognitionTime: number = 0; // 마지막 음성 인식 시간
  private debugInfo: string[] = []; // 디버깅 정보 저장
  private hasSentSummary: boolean = false; // 요약 API 호출 여부 추적

  constructor() {
    this.initRecognition();
  }

  // 디버깅 로그 추가 헬퍼 메서드
  private addDebugLog(message: string) {
    const now = new Date();
    const timestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
    const logEntry = `[${timestamp}] ${message}`;
    this.debugInfo.push(logEntry);

    // 최대 100개 로그만 유지
    if (this.debugInfo.length > 100) {
      this.debugInfo.shift();
    }

    console.log(`🎤 디버깅: ${message}`);
  }

  // 현재 디버깅 상태 반환
  public getDebugState() {
    return {
      isListening: this.isListening,
      currentSpeakingPlayer: this.currentSpeakingPlayer,
      myUserName: this.myUserName,
      accumulatedText: this.accumulatedText,
      hasRecognizedSpeech: this.hasRecognizedSpeech,
      timeSinceLastRecognition: this.lastRecognitionTime
        ? Date.now() - this.lastRecognitionTime
        : null,
      debugLogs: [...this.debugInfo],
    };
  }

  // SpeechRecognition 초기화 (별도 메서드로 분리)
  private initRecognition() {
    try {
      if (
        !('SpeechRecognition' in window) &&
        !('webkitSpeechRecognition' in window)
      ) {
        this.addDebugLog(
          '🚫 이 브라우저는 Speech Recognition을 지원하지 않습니다'
        );
        return;
      }

      // 이전 인스턴스가 있으면 정리
      if (this.recognition) {
        try {
          this.recognition.abort();
          this.recognition.onresult = null;
          this.recognition.onend = null;
          this.recognition.onerror = null;
          this.recognition = null;
        } catch (e) {
          this.addDebugLog(`이전 인스턴스 정리 중 오류: ${e}`);
        }
      }

      // 새 인스턴스 생성
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      // 가장 기본적인 설정
      this.recognition.lang = 'ko-KR';
      this.recognition.interimResults = true;
      this.recognition.continuous = true;
      this.recognition.maxAlternatives = 1;

      // 디버깅을 위해 모든 이벤트 처리
      this.recognition.onstart = () => {
        this.addDebugLog('🎙️ 음성 인식 시작됨');
        this.isListening = true;
      };

      this.recognition.onaudiostart = () => {
        this.addDebugLog('🔊 오디오 캡처 시작됨');
      };

      this.recognition.onsoundstart = () => {
        this.addDebugLog('🔉 소리 감지됨');
      };

      this.recognition.onspeechstart = () => {
        this.addDebugLog('🗣️ 음성 감지됨');
        // 음성이 감지되면 바로 플래그 설정
        if (!this.hasRecognizedSpeech) {
          this.hasRecognizedSpeech = true;
        }
      };

      // 결과 처리 핸들러
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        this.lastRecognitionTime = Date.now();
        this.addDebugLog(
          `✅ 음성 인식 결과 이벤트 발생: ${event.results.length}개 결과`
        );

        if (!this.onResultCallback) {
          this.addDebugLog('❌ 콜백이 없어서 결과 처리 불가');
          return;
        }

        // 내가 현재 발언자가 아니면 처리하지 않음
        if (this.myUserName !== this.currentSpeakingPlayer) {
          this.addDebugLog(
            `🚷 현재 발언자가 아니어서 결과 무시 (나: ${this.myUserName}, 발언자: ${this.currentSpeakingPlayer})`
          );
          return;
        }

        // 모든 결과를 순회하며 처리
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;

          this.addDebugLog(
            `🔤 결과 #${i}: "${transcript}" (확정: ${event.results[i].isFinal}, 신뢰도: ${Math.round(confidence * 100)}%)`
          );

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // 최종 결과만 누적
        if (finalTranscript) {
          this.addDebugLog(`📝 최종 결과 누적: "${finalTranscript}"`);
          this.hasRecognizedSpeech = true; // 음성 인식 성공 표시

          // 공백 추가하여 텍스트 누적
          if (this.accumulatedText) {
            this.accumulatedText += ' ' + finalTranscript;
          } else {
            this.accumulatedText = finalTranscript;
          }

          this.addDebugLog(`📄 현재 누적된 텍스트: "${this.accumulatedText}"`);

          // 최종 결과 콜백
          if (this.onResultCallback) {
            this.onResultCallback({
              text: finalTranscript,
              isFinal: true,
              speaker: 'current',
            });
          }
        }

        // 중간 결과는 콜백만 호출하지만, 음성이 감지된 것은 표시
        if (interimTranscript) {
          // 중간 결과가 있어도 음성 인식이 되고 있다는 표시
          if (!this.hasRecognizedSpeech) {
            this.hasRecognizedSpeech = true;
          }

          this.addDebugLog(`🔄 중간 결과: "${interimTranscript}"`);
          if (this.onResultCallback) {
            this.onResultCallback({
              text: interimTranscript,
              isFinal: false,
              speaker: 'current',
            });
          }
        }
      };

      this.recognition.onspeechend = () => {
        this.addDebugLog('🛑 음성 감지 종료됨');
      };

      this.recognition.onsoundend = () => {
        this.addDebugLog('🔇 소리 감지 종료됨');
      };

      this.recognition.onaudioend = () => {
        this.addDebugLog('🎧 오디오 캡처 종료됨');
      };

      // 오류 처리
      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMsg = `❌ 오류 발생: ${event.error}, 상세: ${event.message || '정보 없음'}`;
        this.addDebugLog(errorMsg);
        console.error(errorMsg, event);

        // 네트워크 오류가 아닌 aborted는 사용자의 명시적 중단이므로 무시
        if (event.error === 'aborted') {
          this.addDebugLog('🛑 의도적으로 중단된 인식, 재시작하지 않음');
          return;
        }

        // 오류 발생 시 인식 재시작 시도 (내가 발언자인 경우에만)
        if (
          this.isListening &&
          this.myUserName === this.currentSpeakingPlayer
        ) {
          this.addDebugLog('🔄 오류 후 재시작 시도 중...');
          setTimeout(() => this.restart(), 1000);
        }
      };

      // 세션 종료 처리
      this.recognition.onend = () => {
        this.addDebugLog('🏁 음성 인식 세션 종료');

        // 아직 듣기 모드이고 내가 발언자인 경우에만 재시작
        // 단, 명시적으로 중지된 것이 아닌 경우에만 재시작
        if (
          this.isListening &&
          this.myUserName === this.currentSpeakingPlayer
        ) {
          this.addDebugLog('🔄 자동 재시작 시도');
          setTimeout(() => this.restart(), 1000);
        }
      };

      this.addDebugLog('✅ 음성 인식 엔진 초기화 완료');
    } catch (error) {
      this.addDebugLog(`❌ 음성 인식 초기화 중 오류: ${error}`);
      console.error('음성 인식 초기화 중 오류:', error);
    }
  }

  // 인식 재시작 헬퍼 메서드
  private restart() {
    if (!this.recognition || !this.isListening) {
      this.addDebugLog('재시작 실패: 인식 객체 없음 또는 듣기 모드 아님');
      return;
    }

    try {
      this.addDebugLog('재시작 중: 이전 인식 중지');
      this.recognition.abort();

      setTimeout(() => {
        try {
          this.addDebugLog('재시작: 새 인식 시작');
          this.recognition.start();
          this.addDebugLog('✅ 인식 재시작 성공');
        } catch (error) {
          this.addDebugLog(`❌ 재시작 실패: ${error}`);

          // 완전히 초기화 후 다시 시작
          this.addDebugLog('🔄 완전히 초기화 후 재시작');
          this.initRecognition();

          setTimeout(() => {
            if (this.recognition && this.onResultCallback) {
              try {
                this.recognition.start();
                this.addDebugLog('✅ 초기화 후 재시작 성공');
              } catch (innerError) {
                this.addDebugLog(`❌ 초기화 후 재시작도 실패: ${innerError}`);
              }
            }
          }, 1000);
        }
      }, 500);
    } catch (error) {
      this.addDebugLog(`❌ 재시작 시도 중 오류: ${error}`);
    }
  }

  public start(onResult: (result: SttResult) => void) {
    if (!this.recognition) {
      this.addDebugLog('❌ 인식 객체가 없어 초기화 시도');
      this.initRecognition();

      if (!this.recognition) {
        this.addDebugLog('⛔ 음성 인식 지원되지 않음');
        return;
      }
    }

    this.addDebugLog('🎬 음성 인식 시작 요청');
    this.onResultCallback = onResult;
    this.isListening = true;

    try {
      // 현재 실행 중인지 확인하기 어려우므로 일단 중지 시도
      try {
        this.recognition.abort();
        this.addDebugLog('기존 인식 중지됨');
      } catch (e) {
        // 이미 중지된 상태면 오류가 발생할 수 있음, 무시
      }

      // 약간의 지연 후 시작
      setTimeout(() => {
        if (!this.recognition) {
          this.addDebugLog('❌ 시작 실패: 인식 객체가 없음');
          return;
        }

        try {
          this.recognition.start();
          this.addDebugLog('✅ 음성 인식 시작 성공');
        } catch (error) {
          this.addDebugLog(`❌ 음성 인식 시작 실패: ${error}`);

          // 초기화 후 다시 시도
          this.addDebugLog('🔄 초기화 후 다시 시도');
          this.initRecognition();

          if (!this.recognition) {
            this.addDebugLog('⛔ 초기화 후에도 인식 객체 생성 실패');
            return;
          }

          setTimeout(() => {
            try {
              this.recognition?.start();
              this.addDebugLog('✅ 두 번째 시도로 음성 인식 시작 성공');
            } catch (innerError) {
              this.addDebugLog(`❌ 음성 인식 재시도 실패: ${innerError}`);
              console.error('음성 인식 재시도 실패:', innerError);
            }
          }, 1000);
        }
      }, 500);
    } catch (error) {
      this.addDebugLog(`❌ 이전 세션 중단 실패: ${error}`);
      console.error('이전 세션 중단 실패:', error);
    }
  }

  public stop() {
    this.addDebugLog('음성 인식 중지 요청');
    if (!this.recognition) return;

    this.isListening = false;
    try {
      this.recognition.abort();
      this.addDebugLog('음성 인식 중지 성공');
    } catch (error) {
      this.addDebugLog(`음성 인식 중지 실패: ${error}`);
    }

    this.onResultCallback = null;

    // 녹음 타임아웃 제거
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }
  }

  public setSpeakingPlayer(playerName: string, myUserName: string) {
    this.addDebugLog(`발언자 설정: ${playerName}, 내 이름: ${myUserName}`);

    // 내 이름 저장
    this.myUserName = myUserName;

    // 발언자가 변경된 경우에만 처리
    if (this.currentSpeakingPlayer !== playerName) {
      this.addDebugLog(
        `발언자 변경됨: ${this.currentSpeakingPlayer} -> ${playerName}`
      );

      // 이전에 실행 중인 모든 것 정리
      this.stopSpeechRecording();

      // 이전 발언자가 있고, 내가 이전 발언자였다면 요약 처리
      if (
        this.currentSpeakingPlayer &&
        this.currentSpeakingPlayer === myUserName
      ) {
        this.addDebugLog('이전에 내가 발언자였으므로 요약 처리');
        this.finishSpeechRecording();
      }

      this.currentSpeakingPlayer = playerName;

      // 발언자가 변경될 때 항상 누적 텍스트 초기화 및 인식 플래그 초기화
      this.addDebugLog('발언자 변경으로 누적 텍스트 초기화');
      this.accumulatedText = '';
      this.hasRecognizedSpeech = false;
      this.hasSentSummary = false; // 요약 API 호출 플래그 초기화

      // 내가 현재 발언자인 경우 STT 시작
      if (playerName === myUserName) {
        this.addDebugLog('내가 발언자이므로 음성 인식 시작');
        // 약간 지연 후 시작 (브라우저 및 UI 안정화를 위해)
        setTimeout(() => {
          this.startSpeechRecording();
        }, 500);
      } else {
        // 내가 발언자가 아닌 경우 STT 중지
        this.addDebugLog('내가 발언자가 아니므로 음성 인식 중지');
        this.stopSpeechRecording();
      }
    } else {
      this.addDebugLog(`발언자 변경 없음 (같은 발언자): ${playerName}`);
    }
  }

  public clearSpeakingPlayer() {
    this.addDebugLog('발언자 초기화');
    this.stopSpeechRecording();
    this.currentSpeakingPlayer = null;
  }

  private startSpeechRecording() {
    this.addDebugLog('🎬 음성 녹음 시작 시도');

    // 이미 실행 중인 인식기가 있으면 정지
    if (this.isListening) {
      this.addDebugLog('이미 실행 중인 인식기 정지');
      this.stop();
    }

    // 타임아웃 제거
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
      this.addDebugLog('이전 타이머 제거됨');
    }

    // 인식 플래그 초기화
    this.hasRecognizedSpeech = false;
    this.accumulatedText = '';

    // 마이크 접근 권한 먼저 확인
    this.checkMicrophoneAccess()
      .then((hasAccess) => {
        if (!hasAccess) {
          this.addDebugLog('⛔ 마이크 권한 없음, 음성 인식 불가능');
          return;
        }

        this.addDebugLog('✅ 마이크 권한 확인됨, 음성 인식 시작');

        // 이 시점에서 콜백이 없다면 글로벌 콜백 함수를 사용
        if (!this.onResultCallback) {
          this.addDebugLog('⚠️ 콜백 함수가 없어 기본 콜백 생성');

          // 임시 콜백 함수 생성 - 결과만 기록
          this.onResultCallback = (result: SttResult) => {
            this.addDebugLog(
              `📥 음성 인식 결과: ${result.text} (확정: ${result.isFinal})`
            );
            if (result.isFinal) {
              this.forceAddText(result.text);
            }
          };
        }

        // 잠시 대기 후 시작 (안정성 위해)
        setTimeout(() => {
          this.addDebugLog('🎙️ 음성 녹음 시작');
          this.start(this.onResultCallback!);

          this.addDebugLog('⏱️ 20초 타이머 시작');
          // 20초 후 자동으로 녹음 종료 및 요약 요청
          this.recordingTimeout = setTimeout(() => {
            this.addDebugLog('⏱️ 20초 타이머 종료, 녹음 종료 및 요약 요청');
            this.finishSpeechRecording();
          }, this.maxRecordingTime);
        }, 500);
      })
      .catch((err) => {
        this.addDebugLog(`❌ 마이크 접근 권한 확인 중 오류: ${err}`);
      });
  }

  private stopSpeechRecording() {
    this.addDebugLog('🎙️ 음성 녹음 중지 (요약 없음)');

    // 타임아웃 제거
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
      this.addDebugLog('⏱️ 타이머 제거됨');
    }

    // 인식 중지
    this.isListening = false;
    try {
      if (this.recognition) {
        this.recognition.abort();
        this.addDebugLog('✅ 음성 인식 중지 성공');
      }
    } catch (error) {
      this.addDebugLog(`❌ 음성 인식 중지 실패: ${error}`);
    }

    this.onResultCallback = null;
  }

  public finishSpeechRecording() {
    this.addDebugLog('📢 녹음 종료 및 요약 요청');

    // 이미 요약을 보냈다면 중복 호출하지 않음
    if (this.hasSentSummary) {
      this.addDebugLog('⚠️ 이미 요약 API가 호출되었으므로 중복 호출 방지');
      this.stop();
      return;
    }

    this.stop();

    // 누적된 텍스트 확인
    this.addDebugLog(`📝 최종 누적된 텍스트 확인: "${this.accumulatedText}"`);

    // 누적된 텍스트가 있거나 강제 추가된 텍스트가 있는 경우 그대로 요약 API 호출
    const trimmedText = this.accumulatedText.trim();
    if (trimmedText) {
      this.addDebugLog(`🔍 누적된 텍스트로 요약 API 호출: "${trimmedText}"`);
      this.hasSentSummary = true; // 요약 API 호출 표시
      this.sendSpeechForSummary(trimmedText);
    } else if (!this.hasRecognizedSpeech) {
      // 음성 인식이 전혀 되지 않은 경우에만 기본 메시지 전송
      this.addDebugLog('⚠️ 음성 인식이 되지 않아 기본 메시지로 요약 API 호출');
      this.hasSentSummary = true; // 요약 API 호출 표시
      this.sendSpeechForSummary('별다른 발언 내용이 없습니다.');
    } else {
      // 음성은 인식되었으나 텍스트가 비어있는 예외적인 상황
      this.addDebugLog(
        '⚠️ 음성 인식 되었으나 텍스트가 비어있어 기본 메시지로 요약 API 호출'
      );
      this.hasSentSummary = true; // 요약 API 호출 표시
      this.sendSpeechForSummary('발언이 명확하게 인식되지 않았습니다.');
    }

    // 누적 텍스트 초기화는 마지막에
    this.accumulatedText = '';
    this.hasRecognizedSpeech = false;
  }

  public processStreamAudio(
    _streamManager: StreamManager,
    _onResult: (result: SttResult) => void
  ) {
    // 더 이상 다른 참가자의 오디오를 처리하지 않음 (현재 발언자만 마이크 활성화)
    this.addDebugLog('processStreamAudio는 더이상 사용하지 않음');
  }

  // 직접 발언 추가 (테스트용)
  public forceAddText(text: string) {
    if (text && text.trim()) {
      const trimmedText = text.trim();
      // 첫 텍스트인 경우 공백 없이 추가
      if (this.accumulatedText) {
        this.accumulatedText += ' ' + trimmedText;
      } else {
        this.accumulatedText = trimmedText;
      }

      // 음성 인식 성공 표시
      this.hasRecognizedSpeech = true;

      this.addDebugLog(`강제로 텍스트 추가됨: "${trimmedText}"`);
      this.addDebugLog(`현재 누적된 텍스트: "${this.accumulatedText}"`);

      return true;
    }
    return false;
  }

  private async sendSpeechForSummary(speech: string) {
    // 빈 문자열이면 API 호출하지 않음
    if (!speech || speech.trim() === '') {
      this.addDebugLog('빈 문자열은 요약 API에 전송할 수 없습니다');
      return;
    }

    try {
      this.addDebugLog(`요약 API 직접 호출, 발언 내용: "${speech}"`);
      const response = await sttSummary(speech);
      this.addDebugLog(`요약 API 응답: ${JSON.stringify(response)}`);
      // 응답은 웹소켓으로 HINT 메시지를 통해 돌아옵니다
    } catch (error) {
      this.addDebugLog(`요약 API 호출 실패: ${error}`);
    }
  }

  // 마이크 액세스 권한 확인
  public async checkMicrophoneAccess(): Promise<boolean> {
    try {
      this.addDebugLog('마이크 액세스 권한 확인 중...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop()); // 검사 후 스트림 종료
      this.addDebugLog('마이크 액세스 권한 확인 성공');
      return true;
    } catch (err) {
      this.addDebugLog(`마이크 액세스 권한 오류: ${err}`);
      return false;
    }
  }
}

export const sttService = new SttService();

export const sttSummary = async (speech: string) => {
  const response = await api.post('/chat/speech/summary', { speech });
  return response.data;
};
