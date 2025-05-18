import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  OpenVidu,
  Publisher,
  Session,
  StreamManager,
  Device,
  StreamEvent,
  ExceptionEvent,
} from 'openvidu-browser';
import {
  getToken,
  Subscriber,
  PlayerState,
  outRoom,
  getPlayerInfo,
  startRound,
  startTurn,
  skipTurn,
  submitVotes,
  VoteResultResponse,
  getVoteResult,
  updateTurn,
  ScoreResponse,
  getScores,
  endRound,
  setRound,
  submitWordGuess,
  getRoundScores,
  getWords,
} from '../../services/api/GameService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useRoomStore } from '../../stores/useRoomStore';
import UserVideoComponent from './UserVideoComponent';
import GameInfo from './GameInfo';
import GameControls from './GameControls';

import { FaceApiResult, loadModels } from '../../services/api/FaceApiService';
import GameChat from './GameChat';
import { useWebSocketContext } from '../../contexts/WebSocketProvider';
import useSocketStore from '../../stores/useSocketStore';
import { sttService, SttResult } from '../../services/api/SttService';
import SttText from '../../components/SttText';
import {
  getRoomData,
  getRoomParticipants,
  RoomParticipantsWrapper,
} from '../../services/api/RoomService';
import Timer, { TimerRef } from '../../components/common/Timer';
import GameButton from '../../components/common/GameButton';
import VoteResultModal from '../../components/modals/VoteResultModal';
import FaceApiEmotion from './FaceApi';
import EmotionLog from './EmotionLog';
import ScoreModal from '../../components/modals/ScoreModal';
import { MicOff, VideoOff } from 'lucide-react';
import SkipModal from '../../components/modals/liarResultModal/SkipModal';
import LiarFoundModal from '../../components/modals/liarResultModal/LiarFoundModal';
import LiarLeaveModal from '../../components/modals/liarResultModal/LiarLeaveModal';
import LiarNotFoundModal from '../../components/modals/liarResultModal/LiarNotFoundModal';
import { notify } from '../../components/common/Toast';
import { useMessageStore } from '../../stores/useMessageStore';
import GameStartCountdownModal from '../../components/modals/GameStartCountdownModal';

// STT 디버깅 모달 컴포넌트
// const SttDebugModal = ({
//   isOpen,
//   onClose,
//   debugInfo,
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   debugInfo: any;
// }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-auto">
//       <div className="bg-gray-800 text-white p-6 rounded-lg max-w-3xl max-h-[80vh] overflow-auto">
//         <h2 className="text-xl font-bold mb-4">STT 디버깅 정보</h2>

//         <div className="mb-4">
//           <h3 className="text-lg font-semibold mb-2">상태 정보</h3>
//           <div className="grid grid-cols-2 gap-2 mb-2">
//             <div className="bg-gray-700 p-2 rounded">
//               <span className="font-medium">마이크 듣기: </span>
//               <span
//                 className={
//                   debugInfo.isListening ? 'text-green-400' : 'text-red-400'
//                 }
//               >
//                 {debugInfo.isListening ? '활성화' : '비활성화'}
//               </span>
//             </div>
//             <div className="bg-gray-700 p-2 rounded">
//               <span className="font-medium">현재 발언자: </span>
//               <span>{debugInfo.currentSpeakingPlayer || '없음'}</span>
//             </div>
//             <div className="bg-gray-700 p-2 rounded">
//               <span className="font-medium">내 이름: </span>
//               <span>{debugInfo.myUserName || '없음'}</span>
//             </div>
//             <div className="bg-gray-700 p-2 rounded">
//               <span className="font-medium">음성 인식됨: </span>
//               <span
//                 className={
//                   debugInfo.hasRecognizedSpeech
//                     ? 'text-green-400'
//                     : 'text-yellow-400'
//                 }
//               >
//                 {debugInfo.hasRecognizedSpeech ? '있음 ✅' : '없음 ❌'}
//               </span>
//             </div>
//             <div className="bg-gray-700 p-2 rounded col-span-2">
//               <span className="font-medium">마지막 인식 시간: </span>
//               <span>
//                 {debugInfo.timeSinceLastRecognition !== null
//                   ? `${Math.round(debugInfo.timeSinceLastRecognition / 1000)}초 전`
//                   : '아직 없음'}
//               </span>
//             </div>
//             <div className="bg-gray-700 p-2 rounded col-span-2">
//               <span className="font-medium">누적 텍스트: </span>
//               <span className="text-green-300">
//                 {debugInfo.accumulatedText || '없음'}
//               </span>
//             </div>
//           </div>
//         </div>

//         <div className="mb-4">
//           <h3 className="text-lg font-semibold mb-2">로그 (최근 순)</h3>
//           <div className="bg-gray-900 p-3 rounded h-60 overflow-y-auto">
//             {debugInfo.debugLogs &&
//               debugInfo.debugLogs
//                 .slice()
//                 .reverse()
//                 .map((log: string, index: number) => (
//                   <div key={index} className="text-xs mb-1 font-mono">
//                     {log}
//                   </div>
//                 ))}
//           </div>
//         </div>

//         <div className="flex justify-between mt-4">
//           <button
//             onClick={async () => {
//               try {
//                 const hasAccess = await sttService.checkMicrophoneAccess();
//                 notify({
//                   type: hasAccess ? 'success' : 'error',
//                   text: hasAccess
//                     ? '마이크 접근 권한이 있습니다.'
//                     : '마이크 접근 권한이 없습니다!',
//                 });
//               } catch (error) {
//                 notify({
//                   type: 'error',
//                   text: '마이크 권한 확인 중 오류가 발생했습니다.',
//                 });
//               }
//             }}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
//           >
//             마이크 권한 확인
//           </button>
//           <button
//             onClick={onClose}
//             className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
//           >
//             닫기
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

const GameRoomPage = () => {
  const [emotionLogs, setEmotionLogs] = useState<
    Record<string, FaceApiResult | null>
  >({});

  const [showGameStartModal, setShowGameStartModal] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  const updateEmotionLog = (
    name: string | null,
    emotion: FaceApiResult | null
  ) => {
    // console.log(`감정 업데이트 - ${name}:`, emotion);

    if (name) {
      setEmotionLogs((prevLogs) => ({
        ...prevLogs,
        [name]: emotion,
      }));
    } else {
      console.log('이름이 존재하지 않습니다.', emotion);
    }
  };

  const [isLogReady, setIsLogReady] = useState(false);
  // 새로고침 플래그
  const [isInGame, setIsInGame] = useState(true);

  const navigation = useNavigate();
  const [myUserName, setMyUserName] = useState<string>('');
  const [_myToken, setMyToken] = useState<string>('');
  const [myRoomCode, setMyRoomCode] = useState('');

  const leaveMessageReceive = useMessageStore((state) => state.leaveMessageOn);
  const leaveMessageState = useMessageStore((state) => state.setLeaveMessageOn);

  // << OpenVidu >>
  // 현재 연결된 세션
  const [session, setSession] = useState<Session | undefined>(undefined);

  // 본인의 카메라/마이크 스트림
  const [publisher, setPublisher] = useState<Publisher | undefined>(undefined);
  // 같은 세션에 있는 다른 참가자 스트림 목록
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  // 현재 사용 중인 카메라 장치 정보
  const [_currentVideoDevice, setCurrentVideoDevice] = useState<Device | null>(
    null
  );

  // 현재 사용 중인 마이크 장치 정보
  const [_currentMicDevice, setCurrentMicDevice] = useState<Device | null>(
    null
  );

  // 카메라, 마이크 상태 관리
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const [playerState, _setPlayerState] = useState<PlayerState>({
    currentPlayer: '',
    isLiar: false,
  });

  const OV = useRef<OpenVidu | null>(null);

  const { userInfo } = useAuthStore();
  const { roomCode, clearRoomCode } = useRoomStore();
  // const setRoomCode = useRoomStore((state) => state.setRoomCode);
  const { stompClient } = useWebSocketContext();
  const {
    clearSubscription,
    clearEmotionSubscription,
    clearChatMessages,
    emotionLogs: socketEmotionLogs,
    emotionSubscription,
  } = useSocketStore();

  const [sttResults, setSttResults] = useState<
    Record<string, SttResult | null>
  >({});

  const sttServiceStarted = useRef(false);

  // emotion 메시지 처리
  useEffect(() => {
    if (emotionSubscription) {
      console.log('GameRoom - Using existing emotion subscription');
    }
  }, [emotionSubscription]);

  // emotion 메시지 처리
  useEffect(() => {
    socketEmotionLogs.forEach((log) => {
      updateEmotionLog(log.userName, log.emotionResult);
    });
  }, [socketEmotionLogs]);

  useEffect(() => {
    if (userInfo?.nickname) {
      setMyUserName(userInfo.nickname);
    } else {
      setMyUserName(`Participant${Math.floor(Math.random() * 100)}`);
    }

    if (userInfo?.token) {
      setMyToken(userInfo.token);
    }

    if (roomCode) {
      setMyRoomCode(roomCode);
    } else {
      setMyRoomCode('');
    }
  }, [userInfo, roomCode]);

  useEffect(() => {
    const modelLoad = async () => {
      try {
        await loadModels('/models');
        console.log('✅ face-api models loaded');
      } catch (error) {
        console.error('load error: ', error);
      }
    };
    modelLoad();
  }, []);

  useEffect(() => {
    if (session) return;

    if (myUserName && myRoomCode && session === undefined) {
      joinSession();
    }
  }, [myUserName, myRoomCode]);

  // 구독자 삭제
  const deleteSubscriber = (streamManager: StreamManager) => {
    setSubscribers((prev) => prev.filter((sub) => sub !== streamManager));
  };

  // 세션 참가
  const joinSession = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    OV.current = new OpenVidu();
    const mySession = OV.current.initSession();

    mySession.on('streamCreated', (event: StreamEvent) => {
      // 사용자 정보 추출
      const clientData = JSON.parse(
        event.stream.connection.data.split('%')[0]
      ).clientData;

      const subscriber = mySession.subscribe(
        event.stream,
        undefined
      ) as Subscriber;

      subscriber.nickname = clientData;
      subscriber.position = subscribers.length + 1;

      setSubscribers((prev) => [...prev, subscriber]);
    });

    mySession.on('streamDestroyed', (event: StreamEvent) => {
      deleteSubscriber(event.stream.streamManager);
    });

    mySession.on('exception', (exception: ExceptionEvent) => {
      console.warn('OpenVidu 예외 발생:', exception);
    });

    try {
      // getToken 분리
      const token = await getToken(myRoomCode);
      await mySession.connect(token, { clientData: myUserName });

      const publisherObj = await OV.current.initPublisherAsync(undefined, {
        audioSource: undefined, // 기본 마이크 사용
        videoSource: undefined, // 기본 카메라 사용
        publishAudio: false, // 처음에는 마이크 꺼진 상태로 시작
        publishVideo: true, // 비디오는 켜진 상태로 시작
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
        mirror: false,
      });

      // 내 퍼블리셔 세션에 송출
      mySession.publish(publisherObj);

      const devices = await OV.current.getDevices();

      // 현재 연결된 비디오 정보
      const videoDevices = devices.filter(
        (device) => device.kind === 'videoinput'
      );

      const currentVideoDeviceId = publisherObj.stream
        .getMediaStream()
        .getVideoTracks()[0]
        .getSettings().deviceId;

      const currentVideoDevice =
        videoDevices.find(
          (device) => device.deviceId === currentVideoDeviceId
        ) || null;

      // 현재 연결된 마이크 정보
      const micDevices = devices.filter(
        (device) => device.kind === 'audioinput'
      );

      const currentMicDeviceId = publisherObj.stream
        .getMediaStream()
        .getAudioTracks()[0]
        .getSettings().deviceId;

      const currentMicDevice =
        micDevices.find((device) => device.deviceId === currentMicDeviceId) ||
        null;

      setSession(mySession);
      setPublisher(publisherObj);
      setCurrentVideoDevice(currentVideoDevice);
      setCurrentMicDevice(currentMicDevice);
    } catch (error) {
      console.error('세션 연결 중 오류 발생:', error);
    }
  };

  const outGameRoom = async () => {
    try {
      if (roomCode) {
        await outRoom(roomCode);
      }
    } catch (error) {
      console.error('게임 종료 실패: ', error);
    }
  };

  // 세션 퇴장
  const leaveSession = useCallback(() => {
    if (session) {
      session.disconnect();
    }

    OV.current = null;
    setSession(undefined);
    setSubscribers([]);

    // 세션 ID 초기화 수정
    setMyRoomCode(roomCode || '');
    // 사용자 이름 초기화 수정
    setMyUserName(
      userInfo?.nickname || 'Participant' + Math.floor(Math.random() * 100)
    );

    setPublisher(undefined);

    // 카메라, 마이크 연결 끊기
    setCurrentVideoDevice(null);
    setCurrentMicDevice(null);

    // 웹소켓 연결 해제 및 소켓 스토어 초기화
    if (stompClient?.connected) {
      stompClient.deactivate();
    }
    clearSubscription();
    clearEmotionSubscription();
    clearChatMessages();

    clearRoomCode();
    outGameRoom();
    setIsInGame(false);
  }, [
    session,
    userInfo,
    stompClient,
    clearSubscription,
    clearEmotionSubscription,
    clearChatMessages,
    roomCode,
  ]);

  const disconnectOpenVidu = () => {
    if (session) session.disconnect();
    OV.current = null;
  };

  const handleBeforeUnload = useCallback(() => {
    leaveSession();
  }, [leaveSession]);

  // 새로고침 이벤트 처리 (room-list 이동)
  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // 컴포넌트 언마운트 시 플래그 제거
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setIsInGame(false);
    };
  }, [handleBeforeUnload]);

  // 새로고침 후 감지 및 redirect
  useEffect(() => {
    if (!isInGame) {
      // navigation('/room-list');
      window.location.href = '/room-list';
    }
  }, []);

  const toggleAudio = () => {
    if (publisher) {
      const newAudioState = !isAudioEnabled;
      const audioTrack = publisher.stream.getMediaStream().getAudioTracks()[0];

      if (audioTrack) {
        // 오디오 트랙의 활성 상태를 제어
        audioTrack.enabled = newAudioState;
        publisher.publishAudio(newAudioState);
        // console.log(`🔊 오디오 상태: ${newAudioState ? '켜짐' : '꺼짐'}`);
      } else {
        console.warn('⚠️ 오디오 트랙이 존재하지 않습니다.');
      }

      setIsAudioEnabled(newAudioState);
    }
  };

  const toggleVideo = () => {
    if (publisher) {
      const newVideoState = !isVideoEnabled;
      const videoTrack = publisher.stream.getMediaStream().getVideoTracks()[0];

      if (videoTrack) {
        // 비디오 트랙의 활성 상태를 제어
        videoTrack.enabled = newVideoState;
        publisher.publishVideo(newVideoState);
        // console.log(`📷 비디오 상태: ${newVideoState ? '켜짐' : '꺼짐'}`);
      } else {
        console.warn('⚠️ 비디오 트랙이 존재하지 않습니다.');
      }

      setIsVideoEnabled(newVideoState);
    }
  };

  const getParticipantPosition = (
    index: number,
    _totalParticipants: number
  ): string => {
    const positions = {
      1: 'col-span-2 col-start-1 row-span-2 row-start-2 h-fit min-h-[150px] min-w-[180px] max-w-[200px] ml-[18px] mt-[15px]',
      2: 'col-span-2 col-start-6 row-span-2 row-start-2 h-fit min-h-[150px] min-w-[180px] max-w-[200px] mt-[15px]',
      3: 'col-span-2 col-start-1 row-span-2 row-start-6 h-fit min-h-[150px] min-w-[180px] max-w-[200px] ml-[18px]',
      4: 'col-span-2 col-start-1 row-span-2 row-start-4 h-fit min-h-[150px] min-w-[180px] max-w-[200px] ml-[18px]',
      5: 'col-span-2 col-start-6 row-span-2 row-start-4 h-fit min-h-[150px] min-w-[180px] max-w-[200px]',
    };
    return positions[index as keyof typeof positions] || '';
  };

  const myPosition =
    'col-span-2 col-start-6 row-span-2 row-start-6 h-fit min-h-[150px] min-w-[180px] max-w-[200px]';

  // STT 결과 처리 함수
  const handleSttResult = (result: SttResult) => {
    console.log('GameRoom received STT result:', result); // 디버깅 로그 추가
    setSttResults((prev) => {
      const newResults = {
        ...prev,
        [result.speaker]: result,
      };
      console.log('Updated STT results:', newResults); // 디버깅 로그 추가

      // 현재 발언자의 발언 내용을 직접 저장 (서비스에서도 저장되지만 확실히 하기 위해)
      if (
        result.speaker === 'current' &&
        result.isFinal &&
        speakingPlayer === myUserName &&
        result.text.trim() !== ''
      ) {
        console.log('최종 발언 내용 직접 저장:', result.text);
        // 강제로 텍스트 추가
        sttService.forceAddText(result.text);
      }

      return newResults;
    });
  };

  // HINT 메시지를 처리하기 위한 상태
  const [hintMessages, setHintMessages] = useState<Record<string, string>>({});

  // 세션 참가 시 STT 시작
  useEffect(() => {
    if (session && publisher && !sttServiceStarted.current) {
      console.log('Starting STT service...');
      try {
        sttService.start(handleSttResult);
        sttServiceStarted.current = true;
      } catch (error) {
        console.error('Error starting STT service:', error);
      }
    }

    return () => {
      if (sttServiceStarted.current) {
        console.log('Cleaning up STT service...');
        try {
          sttService.stop();
          sttServiceStarted.current = false;
        } catch (error) {
          console.error('Error stopping STT service:', error);
        }
      }
    };
  }, [session, publisher]);

  // 초기 세션 연결 후 마이크 상태 설정
  useEffect(() => {
    if (session && publisher) {
      publisher.publishAudio(false);
      setIsAudioEnabled(false);
    }
    // console.log('!!speakingPlayer!!', speakingPlayer, myUserName);

    if (speakingPlayer && speakingPlayer === myUserName) {
      publisher?.publishAudio(true);
      setIsAudioEnabled(true);
    }
    // console.log(
    //   '🎤 초기 마이크 상태 설정 완료:',
    //   speakingPlayer === myUserName
    // );
  }, [session, publisher]);

  // 구독자들의 오디오 스트림 처리는 더 이상 필요 없음
  // 현재 발언자만 마이크를 활성화하고 그 오디오만 처리함

  /////////////////////게임 진행 코드 시작/////////////////////

  const chatMessages = useSocketStore((state) => state.chatMessages); // 메세지 변경만 감지

  // 게임 초기화용 상태
  const [currentTurn, setCurrentTurn] = useState(1);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [totalRoundNumber, setTotalRoundNumber] = useState<number>(3);
  const [category, setCategory] = useState<string>('');
  const [myWord, setMyWord] = useState<string>('');
  const [hostNickname, setHostNickname] = useState<string>('');
  const [gameMode, setGameMode] = useState<string>('DEFAULT');
  const [videoMode, setVideoMode] = useState<string>('VIDEO');
  // 발언 진행 관련
  const [speakingPlayer, setSpeakingPlayer] = useState<string>('');
  const [isTimerReady, setIsTimerReady] = useState(false);
  const speechTimerRef = useRef<TimerRef>(null);
  const pauseTimerRef = useRef<TimerRef>(null);
  const [isSkippingSpeech, setIsSkippingSpeech] = useState(false); // 스킵 중복 클릭 방지
  const [isTurnSkip, setIsTurnSkip] = useState(false);
  // 투표 진행 관련
  const [isVoting, setIsVoting] = useState(false);
  const [selectedTargetNickname, setSelectedTargetNickname] = useState<
    string | null
  >(null);
  const selectedTargetRef = useRef<string | null>(null);
  const voteTimerRef = useRef<TimerRef>(null);
  // 투표 결과 관련
  const [voteResult, setVoteResult] = useState<VoteResultResponse | null>(null);
  const [showVoteResultModal, setShowVoteResultModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showLiarFoundModal, setShowLiarFoundModal] = useState(false);
  const [showLiarNotFoundModal, setShowLiarNotFoundModal] = useState(false);
  const [showLiarLeaveModal, setShowLiarLeaveModal] = useState(false);
  // liar found 관련
  const [guessedWord, setGuessedWord] = useState<string | null>(null);
  const [showGuessedWord, setShowGuessedWord] = useState(false);
  // 점수 관련
  const [roundScoreData, setRoundScoreData] = useState<ScoreResponse | null>(
    null
  );
  const [scoreData, setScoreData] = useState<ScoreResponse | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answerWord, setAnswerWord] = useState<string | null>(null);
  const [foolLiarWord, setFoolLiarWord] = useState<string | null>(null);

  // 플레이어가 중간에 퇴장하는 경우 감지
  const updateParticipants = (inactivaUser: string[]) => {
    console.log('현재 참가자 리스트', participants);
    const updateParticipants = participants.filter(
      (p) => !inactivaUser.includes(p.participantNickname)
    );

    console.log('업데이트 플레이어 정보', updateParticipants);
    setParticipants(updateParticipants);
  };

  const inactiveNickNames = (roomParticipants: RoomParticipantsWrapper) => {
    const inactiveUser = roomParticipants.participants
      .filter((p) => !p.isActive)
      .map((p) => p.nickName);

    console.log('비활성화 플레이어', inactiveUser);
    updateParticipants(inactiveUser);

    const hostUserName = roomParticipants.participants
      .filter((p) => p.isHost)
      .map((p) => p.nickName);
    console.log('방장 플레이어', hostUserName);
    setHostNickname(hostUserName[0] ?? '');
  };

  // 방장 플레이어 변경 확인
  useEffect(() => {
    console.log('방장 플레이어 이름 출력', hostNickname);
  }, [hostNickname]);

  // 플레이어 정보 변경시, room에 참가중인 player 정보 갱신
  useEffect(() => {
    if (leaveMessageReceive) {
      console.log('플레이어가 퇴장했습니다. roomPlayerInfo 다시 받아오기');
      const newPlayerInfo = async () => {
        try {
          const roomParticipants = await getRoomParticipants(roomCode!);
          console.log('✅newRoomParticipants', roomParticipants);
          if (roomParticipants && roomParticipants.participants) {
            inactiveNickNames(roomParticipants);
          } else {
            console.error('참가자 정보가 유효하지 않습니다.');
          }
        } catch (err) {
          console.error('플레이어 정보갱신 오류', err);
        } finally {
          leaveMessageState(false);
        }
      };
      newPlayerInfo();
    }
  }, [leaveMessageReceive]);

  // 참가자 관련 (참가자 순서 지정)
  const [participants, setParticipants] = useState<
    Array<{ participantNickname: string; order: number }>
  >([]);
  const [sortedParticipants, setSortedPraticipants] = useState<
    Array<{ participantNickname: string; order: number }>
  >([]);

  // '나'를 제외한 참가자 순서대로 재정렬
  useEffect(() => {
    if (!myUserName || participants.length === 0) return;

    const filtered = participants.filter(
      (p) => p.participantNickname !== myUserName
    );

    const sorted = [...filtered]
      .sort((a, b) => a.order - b.order)
      .map((p, index) => ({ ...p, order: index + 1 }));

    console.log('participants 정렬 순서 ', sorted);
    setSortedPraticipants(sorted);
  }, [participants]);

  // 정렬된 순서에 따라 position 부여
  useEffect(() => {
    if (
      !sortedParticipants ||
      sortedParticipants.length === 0 ||
      subscribers.length === 0
    )
      return;

    setSubscribers((prev) =>
      prev.map((sub) => {
        const matched = sortedParticipants.find(
          (p) => p.participantNickname === (sub as Subscriber).nickname
        );
        (sub as Subscriber).position = matched
          ? matched.order
          : (sub as Subscriber).position;
        return sub;
      })
    );
  }, [sortedParticipants]);

  // 방정보(방장, 카테고리), 라운드 세팅 개인정보 조회
  useEffect(() => {
    const setupGameInfo = async () => {
      if (!roomCode || !myUserName) return;
      try {
        // 순차적으로 API 호출
        const playerInfoRes = await getPlayerInfo(roomCode);
        const roomInfoRes = await getRoomData(roomCode);

        setRoundNumber(playerInfoRes.data.roundNumber);
        setTotalRoundNumber(playerInfoRes.data.totalRoundNumber);
        setMyWord(playerInfoRes.data.word);
        setCategory(roomInfoRes.roomInfo.category);
        setGameMode(roomInfoRes.roomInfo.gameMode);
        setVideoMode(roomInfoRes.roomInfo.videoMode);
        setHostNickname(roomInfoRes.roomInfo.hostNickname);

        setParticipants(playerInfoRes.data.participants);

        console.log('✅playerInfoRes', playerInfoRes);
        console.log('✅roomInfoRes', roomInfoRes);
        console.log('✅세팅 끝');
        console.log('roundNumber', playerInfoRes.data.roundNumber);
        console.log('totalRoundNumber', playerInfoRes.data.totalRoundNumber);
        console.log('word', playerInfoRes.data.word);
        console.log('category', roomInfoRes.roomInfo.category);
        console.log('hostNickname', roomInfoRes.roomInfo.hostNickname);
        console.log('myUserName', myUserName);

        // 라운드 시작 및 턴 시작 API 순차 호출은 모달이 닫힐 때 실행
      } catch (error) {
        console.error('게임 정보 세팅 중 오류:', error);
      }
    };
    setupGameInfo();
  }, [roomCode, myUserName]);

  // 방 바뀌면 채팅창 초기화
  useEffect(() => {
    clearChatMessages();
  }, [roomCode]);

  // 발언자와 타이머 관련 로직
  useEffect(() => {
    console.log('발언자 타이머 useEffect 실행: ', {
      speakingPlayer,
      isTimerReady,
      gameStarted,
    });

    if (speakingPlayer && isTimerReady && gameStarted) {
      console.log('🎮 타이머 시작:', speakingPlayer);
      speechTimerRef.current?.startTimer(20);
    } else {
      console.log('🎮 타이머 시작 조건 미충족:', {
        speakingPlayer: Boolean(speakingPlayer),
        isTimerReady,
        gameStarted,
      });
    }
  }, [speakingPlayer, isTimerReady, gameStarted]);

  // 발언시간 skip 시 타이머
  useEffect(() => {
    if (!isTurnSkip) return;

    pauseTimerRef.current?.startTimer(3);

    const timeoutId = setTimeout(() => {
      setIsTurnSkip(false);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [isTurnSkip]);

  // 채팅 감지
  useEffect(() => {
    const latest = chatMessages.at(-1);

    // NORMAL일 경우 무시
    if (!latest) return;

    if (latest.chatType === 'NORMAL') return;

    // 개인 발언
    if (latest.chatType === 'TURN_START') {
      console.log('💡TURN_START 수신 확인');

      setIsTurnSkip(false);

      // 닉네임 파싱
      const nickname = latest.content.split('님의')[0]?.trim();
      if (nickname) {
        console.log('🎤 발언자:', nickname);
        setSpeakingPlayer(nickname);

        // STT 서비스에 현재 발언자 설정
        sttService.setSpeakingPlayer(nickname, myUserName);

        // 내가 발언자인 경우 마이크 강제 활성화, 아니면 비활성화
        if (nickname === myUserName && publisher) {
          console.log('🎤 내가 발언자입니다. 마이크 강제 켜기');
          // 강제로 마이크 켜기 (상태와 관계없이)
          publisher.publishAudio(true);
          setIsAudioEnabled(true);
          // 로그 추가로 마이크 상태 확인
          setTimeout(() => {
            const audioTrack = publisher.stream
              .getMediaStream()
              .getAudioTracks()[0];
            console.log(
              '🎤 내 마이크 상태:',
              audioTrack?.enabled,
              '활성화:',
              publisher.stream.audioActive
            );
          }, 500);
        } else if (publisher) {
          console.log('🎤 내가 발언자가 아닙니다. 마이크 강제 끄기');
          // 강제로 마이크 끄기 (상태와 관계없이)
          publisher.publishAudio(false);
          setIsAudioEnabled(false);
        }
      }
    }

    // 턴 스킵
    if (latest.chatType === 'TURN_SKIP') {
      speechTimerRef.current?.pauseTimer();
      setIsTurnSkip(true);
    }

    // 모든 발언 종료 후 투표 시작
    if (latest.chatType === 'ROUND_END') {
      if (showLiarLeaveModal) return;
      console.log('💡투표 시작');

      // 내가 마지막 발언자였으면 녹음 종료 및 요약 요청
      if (myUserName === speakingPlayer) {
        console.log('라운드 종료: 내가 마지막 발언자였으므로 마이크 종료');
        // 요약 처리 제거 - 타이머에서만 처리
        // sttService.finishSpeechRecording();
      }

      setSpeakingPlayer('');
      setIsVoting(true);
      setSelectedTargetNickname(null);
      // STT 서비스 발언자 초기화
      sttService.clearSpeakingPlayer();

      // 투표 시작 시 마이크 끄기
      if (isAudioEnabled && publisher) {
        console.log('🎤 투표 시작. 마이크 끄기');
        // 마이크 직접 제어
        publisher.publishAudio(false);
        setIsAudioEnabled(false);
      }
    }

    // HINT 메시지 처리
    if (latest.chatType === 'HINT') {
      if (showLiarLeaveModal) return;

      console.log('💡HINT 메시지 수신:', latest);
      console.log('💡발신자:', latest.sender, '내용:', latest.content);

      // HINT 메시지는 sttSummary API의 결과로 WebSocket을 통해 받습니다
      // sender는 발언자의 닉네임, content는 요약된 내용입니다
      setHintMessages((prev) => ({
        ...prev,
        [latest.sender]: latest.content,
      }));
    }

    // 모든 플레이어 투표 종료 후 (VoteResultModal 열기)
    if (latest.chatType === 'VOTE_SUBMITTED') {
      if (showLiarLeaveModal) return;

      console.log('🔥🔥🔥모든 플레이어 투표 완료');
      console.log(latest);

      (async () => {
        try {
          // 초기화
          setSelectedTargetNickname(null);
          selectedTargetRef.current = null;
          setIsVoting(false);

          const result = await getVoteResult(roomCode!, roundNumber);
          console.log('✅투표 결과 조회 api', result);

          setVoteResult(result);
          setShowVoteResultModal(true);
        } catch (error) {
          console.error('투표 결과 조회 실패:', error);
          console.log('투표 결과 조회 실패시 (호스트)', hostNickname);
        }
      })();
    }

    // 라이어 제시어 추측 제출 후 (LiarFoundModal 이후 로직)
    if (latest.chatType === 'GUESS_SUBMITTED') {
      if (showLiarLeaveModal) return;
      (async () => {
        setIsCorrect(latest.content.startsWith('정답!') ? true : false);
        const match = latest.content.match(/님이 (.+?)\(을\)를 제출했습니다/);
        const word = match?.[1] || null;
        console.log('guess submitted: ', word);

        console.log('💡라이어가 추측한 제시어', word);
        setGuessedWord(word);
        setShowGuessedWord(true);

        try {
          const words = await getWords(roomCode!);
          setAnswerWord(words.word1);
          setFoolLiarWord(words.word2);
        } catch (err) {
          console.error('단어 조회 실패:', err);
        }

        setTimeout(async () => {
          setShowGuessedWord(false);
          await fetchAndShowScore();
        }, 2000);
      })();
    }

    if (latest.chatType === 'LIAR_DISCONNECT') {
      if (latest) {
        console.log(`${latest.chatType} 메시지 수신:`, latest);
        setShowLiarLeaveModal(true);
      }
    }
  }, [chatMessages, myUserName, publisher]);

  // 발언 skip 핸들러
  const handleSkipTurn = async (roomCode: string | null) => {
    if (!roomCode) {
      console.warn('Room code가 없습니다.');
      return;
    }
    if (isSkippingSpeech) {
      notify({ type: 'warning', text: '이미 스킵을 눌렀습니다.' });
      return;
    }
    setIsSkippingSpeech(true);

    try {
      // 발언 종료 및 요약 처리
      if (myUserName === speakingPlayer) {
        console.log('발언 스킵: 내 턴이므로 녹음 종료 및 요약 요청');

        // 즉시 녹음 종료 및 요약 처리
        sttService.finishSpeechRecording();
      }

      await skipTurn(roomCode);
      console.log('턴이 스킵되었습니다.');
    } catch (error) {
      console.error('턴 스킵 실패:', error);
    } finally {
      setTimeout(() => setIsSkippingSpeech(false), 5000); // 5초 후 스킵 버튼 초기화
    }
  };

  // Timer 컴포넌트가 마운트되었는지 확인
  const handleTimerMount = useCallback(() => {
    console.log('Timer mounted');
    setIsTimerReady(true);
  }, []);

  // 발언 타이머 종료 시 처리
  const handleSpeechTimerEnd = useCallback(() => {
    console.log('⏰ 발언 타이머 종료');
    // 내가 발언자인 경우 녹음 종료 및 요약 처리
    if (myUserName === speakingPlayer) {
      console.log('내 턴이 끝났으므로 녹음 종료 및 요약 요청');
      sttService.finishSpeechRecording();
    }
  }, [myUserName, speakingPlayer]);

  useEffect(() => {
    if (isVoting) {
      setTimeout(() => {
        voteTimerRef.current?.startTimer(10);
      }, 0); // 다음 이벤트 루프에서 실행
    }
  }, [isVoting]);

  // 투표 진행 시 마우스 포인터 핸들러
  useEffect(() => {
    if (!isVoting) return;

    const handleMouseMove = (e: MouseEvent) => {
      const overlay = document.getElementById('vote-overlay'); // 오버레이 요소
      if (overlay) {
        overlay.style.setProperty('--x', `${e.clientX}px`); // 마우스 X 좌표를 CSS 변수로 설정
        overlay.style.setProperty('--y', `${e.clientY}px`); // 마우스 Y 좌표를 CSS 변수로 설정
      }
    };

    window.addEventListener('mousemove', handleMouseMove); // 마우스 움직임에 반응해서 handleMouseMove 실행
    return () => {
      window.removeEventListener('mousemove', handleMouseMove); // 컴포넌트 언마운트 시 이벤트 제거
    };
  }, [isVoting]);

  // 각 비디오 컴포넌트 클릭 시 선택된 대상 설정
  const handleSelectTarget = (nickname: string | undefined) => {
    if (nickname) {
      setSelectedTargetNickname(nickname);
      console.log('선택 : ', nickname);
    }
  };

  // 기권 버튼 클릭
  const handleVoteSkip = () => {
    setSelectedTargetNickname('__SKIP__');
  };

  // selectedTargetNickname이 바뀔 때마다 ref에도 저장 (투표 제출 시 최신값 전달)
  useEffect(() => {
    selectedTargetRef.current = selectedTargetNickname;
  }, [selectedTargetNickname]);

  // 투표 타이머 종료 시 최종 투표 제출
  const handleVotingEnd = async () => {
    console.log('투표 제출', currentTurn, selectedTargetRef.current);
    try {
      let target: string | null = selectedTargetRef.current;

      // 3번째 턴, 미선택이면 본인에게 투표
      if (currentTurn >= 3 && !target) {
        target = myUserName;
      }
      if (target === '__SKIP__') target = null;

      await submitVotes(roomCode!, roundNumber, target);
      console.log('투표 완료:', target);
    } catch (err) {
      console.error('투표 제출 실패:', err);
    }
  };

  // 점수 조회 및 모달 표시
  const fetchAndShowScore = async () => {
    try {
      const [roundResult, totalResult] = await Promise.all([
        getRoundScores(roomCode!),
        getScores(roomCode!),
      ]);

      setRoundScoreData(roundResult);
      setScoreData(totalResult);
      setShowScoreModal(true);

      console.log('현재 라운드 끝', roundNumber);
      setCurrentTurn(1); // 초기화
      if (myUserName === hostNickname) {
        await endRound(roomCode!, roundNumber);
        if (roundNumber < totalRoundNumber) {
          await setRound(roomCode!);
        }
      }
    } catch (error) {
      console.error('점수 조회 실패:', error);
    }
  };

  // 점수 조회 및 모달 표시
  const onlyFetchGameInfo = async () => {
    try {
      console.log('현재 라운드 끝', roundNumber);
      console.log('현재 호스트', hostNickname);
      setCurrentTurn(1); // 초기화
      if (myUserName === hostNickname) {
        await endRound(roomCode!, roundNumber);
        if (roundNumber < totalRoundNumber) {
          await setRound(roomCode!);
        }
      }
    } catch (error) {
      console.error('GameInfo fetch 실패:', error);
    }
  };

  // 점수 모달 분기 처리
  const getScoreModalType = (): 'liar-win' | 'civilian-win' | 'final-score' => {
    if (roundNumber >= totalRoundNumber) return 'final-score';
    if (voteResult?.detected) {
      if (isCorrect) return 'liar-win';
      else return 'civilian-win';
    } else return 'liar-win';
  };

  // 점수 모달 이후 로직 (마지막 라운드인지 구분)
  const handleScoreTimeEnd = async () => {
    try {
      setShowScoreModal(false);
      setShowLiarLeaveModal(false);

      // 다음 라운드 세팅
      if (roundNumber < totalRoundNumber) {
        const playerInfoRes = await getPlayerInfo(roomCode!);
        console.log('✅playerInfoRes', playerInfoRes);
        console.log('✅세팅 끝');

        setRoundNumber(playerInfoRes.data.roundNumber);
        setMyWord(playerInfoRes.data.word);
        setParticipants(playerInfoRes.data.participants);

        console.log('다음 라운드', playerInfoRes.data.roundNumber);
        if (myUserName === hostNickname) {
          await startRound(roomCode!, playerInfoRes.data.roundNumber);
          await startTurn(roomCode!, playerInfoRes.data.roundNumber);
        }
      }
      // 마지막 라운드 종료 후 게임 종료
      else {
        disconnectOpenVidu();
        navigation('/waiting-room');
      }
    } catch (error) {
      console.error('라운드 종료 처리 실패:', error);
    }
  };

  // 게임 시작 모달 닫힐 때 게임 시작
  const handleGameStart = useCallback(async () => {
    console.log('🚀 handleGameStart 함수 시작!');

    if (!roomCode) {
      console.error('❌ 방 코드가 없습니다:', roomCode);
      return;
    }

    if (!myUserName) {
      console.error('❌ 사용자 이름이 없습니다:', myUserName);
      return;
    }

    // 게임 시작 상태 설정
    console.log('⚙️ 게임 시작 상태 변경 전:', gameStarted);
    setGameStarted(true);
    console.log('✅ 게임 시작 상태 변경 후:', true);

    // 게임 시작 로직 실행
    console.log('👥 방장 여부 확인:', myUserName === hostNickname);

    try {
      if (myUserName === hostNickname) {
        console.log('🎲 방장이 게임 시작 API 호출 시작');
        // startRound 먼저 실행
        const roundResult = await startRound(roomCode, roundNumber);
        console.log('✅ startRound 호출 완료', roundResult);

        // startRound 성공 후 startTurn 실행
        const turnResult = await startTurn(roomCode, roundNumber);
        console.log('✅ startTurn 호출 완료', turnResult);
      } else {
        console.log('👤 방장이 아닌 유저는 API 호출하지 않음');
      }
    } catch (error) {
      console.error('❌ 라운드/턴 시작 중 오류:', error);
    }
  }, [roomCode, myUserName, hostNickname, roundNumber]);

  return (
    <>
      {session !== undefined && sortedParticipants.length > 0 ? (
        <>
          <div className="w-full h-full flex flex-col px-8">
            <div className="absolute top-6 right-6 flex items-center gap-3 z-100">
              {/* STT 디버깅 버튼 */}
              {/* <button
                onClick={() => setShowSttDebug(true)}
                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center"
                title="STT 디버깅"
              >
                <Info size={16} />
              </button> */}

              {/* --- 발언 시간 --- */}
              <>
                {/* 발언자만 skip 버튼 표시 */}
                {myUserName === speakingPlayer && (
                  <GameButton
                    text="Skip"
                    size="small"
                    variant="neon"
                    onClick={() => handleSkipTurn(roomCode)}
                    disabled={isSkippingSpeech}
                  />
                )}
                {/* 발언 타이머는 모두에게 표시 */}
                {/* speakingPlayer가 skip 버튼을 누르지 않은 경우 */}
                {speakingPlayer && !isTurnSkip && (
                  <div className="relative">
                    <Timer
                      ref={speechTimerRef}
                      onTimeEnd={handleSpeechTimerEnd}
                      size="medium"
                      onMount={handleTimerMount}
                    />
                  </div>
                )}

                {/* speakingPlayer가 skip 버튼을 누른 경우 */}
                {isTurnSkip && (
                  <div className="relative">
                    <Timer ref={pauseTimerRef} size="medium" />
                  </div>
                )}
              </>
              {/* --- 투표 시간 --- */}
              {isVoting && (
                <>
                  {currentTurn < 3 ? (
                    <>
                      <div className="text-gray-0 px-3 py-1 rounded-full bg-gray-800 border border-dashed border-gray-500 whitespace-nowrap flex-shrink">
                        <p>플레이어를 선택해 투표를 해주세요.</p>
                        <p>
                          ※ 시간 내에 투표하지 않으면{' '}
                          <span className="text-primary-600 font-bold">
                            기권
                          </span>
                          으로 투표됩니다.
                        </p>
                      </div>
                      <GameButton
                        text="기권"
                        size="small"
                        variant={
                          selectedTargetNickname === '__SKIP__'
                            ? 'default'
                            : 'gray'
                        }
                        onClick={handleVoteSkip}
                      />
                    </>
                  ) : (
                    <div className="text-gray-0 px-3 py-1 rounded-full bg-gray-800 border border-dashed border-gray-500 whitespace-nowrap flex-shrink">
                      ※ 시간 내에 투표하지 않으면{' '}
                      <span className="text-primary-600 font-bold">
                        자기 자신
                      </span>
                      에게 투표됩니다
                    </div>
                  )}
                  <div className="relative">
                    <Timer
                      ref={voteTimerRef}
                      onTimeEnd={handleVotingEnd}
                      size="medium"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="text-white w-full h-full grid grid-cols-7">
              <GameInfo
                round={roundNumber}
                totalRoundNumber={totalRoundNumber}
                turn={currentTurn}
                category={category}
                topic={
                  myWord
                    ? myWord
                    : '당신은 라이어입니다! 제시어를 추측해보세요.'
                }
                isLiar={playerState.isLiar} // 투표 결과 조회 때 받음
              />

              {/* Video 영역 */}
              {subscribers.map((sub, index) => {
                const position = sortedParticipants.find(
                  (p) => p.participantNickname === (sub as Subscriber).nickname
                )?.order;

                return (
                  <div
                    key={sub.id || index}
                    onClick={() => isVoting && handleSelectTarget(sub.nickname)}
                    className={`relative ${getParticipantPosition(position!, subscribers.length)} 
                    ${isVoting ? 'cursor-pointer' : ''}
                    ${sub.nickname === speakingPlayer ? 'rounded animate-glow' : ''}`}
                  >
                    {/* 선택된 타겟에 과녁 이미지 */}
                    {selectedTargetNickname === sub.nickname && (
                      <img
                        src="assets/target.png"
                        alt="타겟"
                        className="absolute top-1/2 left-1/2 w-20 h-20 z-50 -translate-x-1/2 -translate-y-1/2"
                      />
                    )}
                    <div className="flex flex-row justify-start items-center gap-2 mb-1">
                      <div className="w-full min-w-[200px] h-fit bg-gray-700 flex items-center justify-center overflow-hidden rounded-lg shadow-2xl">
                        <div className="w-full h-full relative">
                          <div className="absolute flex flex-row gap-1 top-2 left-2 z-10">
                            <div className="bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                              {sub.nickname}
                            </div>
                            {!sub.stream.audioActive && (
                              <div className="flex justify-center items-center bg-black p-1 rounded text-sm">
                                <MicOff size={19} color="red" opacity={50} />
                              </div>
                            )}
                            {/* </div> */}
                          </div>
                          <SttText
                            sttResult={
                              sttResults[(sub as Subscriber).nickname || ''] ||
                              null
                            }
                            speaker={(sub as Subscriber).nickname || 'unknown'}
                            hintMessage={
                              hintMessages[(sub as Subscriber).nickname || '']
                            }
                          />
                          <div className="w-full min-h-[150px] max-h-[170px] flex items-center justify-center">
                            {sub.stream.videoActive ? (
                              videoMode === 'BLIND' ? (
                                <img
                                  src="/assets/blindMode.png"
                                  alt="blind mode"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <UserVideoComponent streamManager={sub} />
                              )
                            ) : (
                              <div className="w-full h-full flex justify-center">
                                <VideoOff size={50} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <EmotionLog
                          name={sub.nickname!}
                          emotion={emotionLogs[sub.nickname!] || undefined}
                          isLogReady={isLogReady}
                        />
                      </div>
                    </div>
                    {/* 👉 발언자 표시 포인팅 이모지 */}
                    {sub.nickname === speakingPlayer && (
                      <>
                        {position === 2 || position === 5 ? (
                          <div className="animate-bounce-x-right absolute bottom-15 left-[-120px] z-60">
                            <img
                              src="assets/point-purple-right.png"
                              className="w-[100px]"
                            />
                          </div>
                        ) : (
                          <div className="animate-bounce-x-left absolute bottom-15 right-[-290px] z-60">
                            <img
                              src="assets/point-purple-left.png"
                              className="w-[100px]"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              {/* my video */}
              <div
                onClick={() => isVoting && handleSelectTarget(myUserName)}
                className={`relative ${myPosition} 
                ${isVoting ? 'cursor-pointer' : ''}
                ${myUserName === speakingPlayer ? 'animate-glow' : ''}`}
              >
                {selectedTargetNickname === myUserName && (
                  <img
                    src="assets/target.png"
                    alt="타겟"
                    className="absolute top-1/2 left-1/2 w-20 h-20 z-30 -translate-x-1/2 -translate-y-1/2"
                  />
                )}
                <div className="flex flex-row justify-start items-center gap-2">
                  <div className="w-full min-w-[200px] min-h-[150px] max-h-[170px] bg-pink-300 flex items-center justify-center overflow-hidden rounded-lg">
                    <div className="w-full min-h-[150px] max-h-[170px] relative">
                      <div className="absolute flex flex-row gap-1 top-2 left-2 z-10">
                        <div className="bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                          나
                        </div>
                        {isAudioEnabled ? null : (
                          <div className="flex justify-center items-center bg-black p-1 rounded text-sm">
                            <MicOff size={19} color="red" opacity={50} />
                          </div>
                        )}
                      </div>
                      <SttText
                        sttResult={sttResults['current'] || null}
                        speaker="나"
                        hintMessage={hintMessages[myUserName]}
                      />
                      <div className="w-full min-h-[150px] max-h-[180px] flex items-center justify-center">
                        {publisher && isVideoEnabled ? (
                          <UserVideoComponent streamManager={publisher} />
                        ) : (
                          <div className="text-5xl font-bold w-full max-h-[170px] min-h-[150px] flex justify-center items-center">
                            <VideoOff size={50} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {publisher &&
                  publisher.stream.getMediaStream().getVideoTracks()[0]
                    ?.readyState === 'live' ? (
                    <div>
                      <FaceApiEmotion
                        streamManager={publisher}
                        name={myUserName}
                        roomCode={roomCode}
                        onEmotionUpdate={(emotionResult) =>
                          updateEmotionLog(myUserName, emotionResult)
                        }
                        isLogReady={isLogReady}
                        setIsLogReady={setIsLogReady}
                      />
                      <EmotionLog
                        name={myUserName}
                        emotion={emotionLogs[myUserName] || undefined}
                        isLogReady={isLogReady}
                      />
                    </div>
                  ) : (
                    <>
                      <EmotionLog
                        name={myUserName}
                        emotion={emotionLogs[myUserName] || undefined}
                        isLogReady={isLogReady}
                      />
                    </>
                  )}
                </div>
                {/* 👉 발언자 표시 포인팅 이모지 */}
                {myUserName === speakingPlayer && (
                  <div className="animate-bounce-x-right absolute bottom-15 left-[-120px] z-60">
                    <img
                      src="assets/point-purple-right.png"
                      className="w-[100px]"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mb-2 mt-1 text-white">
              <div className="z-10 justify-center">
                <GameChat />
              </div>
              <GameControls
                isAudioEnabled={isAudioEnabled}
                isVideoEnabled={isVideoEnabled}
                myUserName={myUserName}
                speakingPlayer={speakingPlayer}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onLeaveSession={leaveSession}
                videoMode={videoMode}
              />
            </div>
          </div>
        </>
      ) : null}
      {/* 투표 진행 화면 */}
      <div
        id="vote-overlay" // 마우스 위치 조정을 위한 ID
        className="fixed inset-0 z-20 pointer-events-none transition-opacity duration-500" // 화면 전체 덮는 레이어
        style={{
          opacity: isVoting ? 0.8 : 0,
          background:
            'radial-gradient(circle at var(--x, 50vw) var(--y, 50vh), transparent 80px, rgba(0,0,0,0.8) 10px)', // 마우스 위치에 원형 밝은 영역 (마우스 주변 80px까지 밝고, 10px까지 fade)
          pointerEvents: 'none',
        }}
      />
      {/* 투표 결과 모달(voteResultModal) */}
      {showVoteResultModal && voteResult && (
        <VoteResultModal
          result={voteResult}
          roundNumber={roundNumber}
          totalRoundNumber={totalRoundNumber}
          onNext={() => {
            setShowVoteResultModal(false);
            const isLastTurn = currentTurn === 3;

            if (voteResult.skip) {
              if (isLastTurn) {
                setShowLiarNotFoundModal(true); // 마지막 턴이면 skip 무시하고 liar not found 처리
              } else {
                setShowSkipModal(true); // 마지막 턴이 아니면 기존처럼 skip 모달
              }
            } else if (voteResult.detected) {
              setShowLiarFoundModal(true);
            } else {
              setShowLiarNotFoundModal(true);
            }
          }}
        />
      )}
      {/* 투표결과모달(voteResultModal) 후 로직 */}
      {/* 1) SkipModal */}
      {showSkipModal && voteResult && (
        <SkipModal
          skipCount={
            voteResult.results.find((r) => !r.targetNickname)?.voteCount || 0
          }
          roundNumber={roundNumber}
          totalRoundNumber={totalRoundNumber}
          onNext={async () => {
            // Skip 모달 이후 - 다음 턴으로
            setShowSkipModal(false);

            if (myUserName === hostNickname) {
              try {
                await updateTurn(roomCode!, roundNumber);
                await startTurn(roomCode!, roundNumber);
                console.log('SKIP 이후 다음 턴 시작');
              } catch (e) {
                console.error('다음 턴 시작 실패', e);
              }
            }

            setCurrentTurn((prev) => prev + 1);
          }}
        />
      )}
      {/* 2) LiarFoundModal */}
      {showLiarFoundModal && voteResult && (
        <LiarFoundModal
          roundNumber={roundNumber}
          totalRoundNumber={totalRoundNumber}
          liarNickname={voteResult.liarNickname}
          onNext={
            // LiarFoundModal 이후 (라이어가 제시어 제출 버튼 클릭 시)
            // 1. submitWordGuess api 호출
            // 2. GUESS_SUBMITTED 이벤트 처리 (입력한 제시어 모달 띄우고, ScoreModal(CIVILIAN WIN) 열기)
            async (word: string) => {
              if (myUserName === voteResult.liarNickname) {
                try {
                  console.log('라이어가 입력한 제시어: ', word);
                  await submitWordGuess(roomCode!, roundNumber, word);
                } catch (err: any) {
                  const msg =
                    err?.response?.data?.message ||
                    '제시어 제출에 실패했습니다.';
                  notify({ type: 'error', text: msg });
                }
              }
              setShowLiarFoundModal(false);
            }
          }
        />
      )}
      {/* 3) LiarNotFoundModal */}
      {showLiarNotFoundModal && voteResult && (
        <LiarNotFoundModal
          roundNumber={roundNumber}
          totalRoundNumber={totalRoundNumber}
          liarNickname={voteResult.liarNickname}
          onNext={
            // LiarNotFoundModal 이후 - ScoreModal(LIAR WIN) 열기기
            // setShowLiarNotFoundModal(false);
            // await fetchAndShowScore();
            async (word: string) => {
              if (myUserName === voteResult.liarNickname) {
                try {
                  console.log('라이어가 입력한 제시어: ', word);
                  await submitWordGuess(roomCode!, roundNumber, word);
                } catch (err: any) {
                  const msg =
                    err?.response?.data?.message ||
                    '제시어 제출에 실패했습니다.';
                  notify({ type: 'error', text: msg });
                }
              }
              setShowLiarNotFoundModal(false);
            }
          }
        />
      )}

      {/* 4) LiarLeaveModal */}
      {showLiarLeaveModal && (
        <LiarLeaveModal
          roundNumber={roundNumber}
          totalRoundNumber={totalRoundNumber}
          onNext={async () => {
            // setShowLiarLeaveModal(false);
            await onlyFetchGameInfo();
            await handleScoreTimeEnd();
          }}
        />
      )}

      {/* 라이어가 추측한 제시어 표시 모달 */}
      {showGuessedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white border-2 border-primary-600 text-gray-800 p-10 rounded-2xl text-center shadow-2xl max-w-xl w-full mx-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 via-blue-500 to-primary-600"></div>
            {guessedWord ? (
              <>
                <div className="flex justify-center mb-6">
                  {isCorrect ? (
                    <div className="bg-green-100 border-2 border-green-500 rounded-full p-6 animate-pulse shadow-lg shadow-green-500/20">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                  ) : (
                    <div className="bg-red-100 border-2 border-red-500 rounded-full p-6 animate-pulse shadow-lg shadow-red-500/20">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                    </div>
                  )}
                </div>
                <p className="display-medium mb-4 text-5xl font-bold">
                  <span
                    className={isCorrect ? 'text-green-600' : 'text-red-600'}
                  >
                    {isCorrect ? '정답!' : '오답!'}
                  </span>
                </p>
                <p className="headline-medium mb-6 text-gray-700">
                  라이어가 제시어로 제출한 단어는
                </p>
                <div className="bg-gray-100 py-5 px-8 rounded-lg border border-primary-600/30 mb-4">
                  <p className="display-small text-4xl font-extrabold text-primary-600 tracking-wider">
                    {guessedWord}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-6">
                  <div className="bg-yellow-100 border-2 border-yellow-500 rounded-full p-6 animate-pulse shadow-lg shadow-yellow-500/20">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="80"
                      height="80"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                </div>
                <p className="display-medium mb-6 text-5xl text-yellow-600 font-bold">
                  제한 시간 초과!
                </p>
                <p className="headline-medium text-red-600 max-w-lg mx-auto">
                  라이어가 제시어를 제출하지 못했습니다!
                </p>
              </>
            )}
            {answerWord && (
              <div className="flex justify-center">
                <div className="mt-4 headline-small text-[#6F2872] ">
                  <p className="mb-1">정답 제시어</p>
                  <div className="inline-block px-3 py-1 bg-gray-100 border border-gray-300 rounded-full headline-medium font-semibold text-gray-700">
                    {answerWord}
                  </div>
                </div>
                {gameMode === 'FOOL' && (
                  <div className="mt-4 headline-small text-[#6F2872] ml-5">
                    <p className="mb-1">라이어 제시어</p>
                    <div className="inline-block px-3 py-1 bg-gray-100 border border-gray-300 rounded-full headline-medium font-semibold text-gray-700">
                      {foolLiarWord}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="mt-8 text-sm text-gray-500 animate-pulse">
              결과 화면은 잠시 후 자동으로 닫힙니다...
            </div>
          </div>
        </div>
      )}

      {/* 점수 모달 */}
      {/* 
        점수 모달 열 때(fetchAndShowScore) 라운드 종료(endRound), 다음 roundNumber 갱신(setRound)
        점수 모달 타이머 끝날 때(handleScoreTimeEnd) 다음 라운드 개인정보 조회(getPlayerInfo)  
      */}
      {showScoreModal && scoreData && (
        <>
          <ScoreModal
            type={getScoreModalType()}
            roundNumber={roundNumber}
            totalRoundNumber={totalRoundNumber}
            scores={scoreData.scores}
            roundScores={roundScoreData?.scores}
            onNext={handleScoreTimeEnd}
          />
        </>
      )}
      {/* STT 디버깅 모달 */}
      {/* <SttDebugModal
        isOpen={showSttDebug}
        onClose={() => setShowSttDebug(false)}
        debugInfo={debugInfo}
      /> */}
      {/* 게임 시작 카운트다운 모달 */}
      <GameStartCountdownModal
        isOpen={showGameStartModal}
        onClose={() => {
          console.log('모달 닫기 함수 실행');
          setShowGameStartModal(false);
          handleGameStart();
        }}
        gameMode={gameMode}
        videoMode={videoMode}
        category={category}
        totalRounds={totalRoundNumber}
      />
    </>
  );
};

export default GameRoomPage;
