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
  GameState,
  PlayerState,
  outRoom,
  getPlayerInfo,
  startRound,
  startTurn,
  skipTurn,
  submitVotes,
  VoteResultResponse,
  getVoteResult,
  endTurn,
  ScoreResponse,
  getScores,
  endRound,
  setRound,
  endGame,
} from '../../services/api/GameService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useRoomStore } from '../../stores/useRoomStore';
import UserVideoComponent from './UserVideoComponent';
import GameInfo from './GameInfo';
import GameControls from './GameControls';

import { FaceApiResult } from '../../services/api/FaceApiService';
import { loadModels } from '../../services/api/FaceApiService';
import GameChat from './GameChat';
import { useWebSocketContext } from '../../contexts/WebSocketProvider';
import useSocketStore from '../../stores/useSocketStore';
import { sttService, SttResult } from '../../services/api/SttService';
import SttText from '../../components/SttText';
import { getRoomData } from '../../services/api/RoomService';
import Timer, { TimerRef } from '../../components/common/Timer';
import GameButton from '../../components/common/GameButton';
import VoteResultModal from '../../components/modals/VoteResultModal';
import FaceApiEmotion from './FaceApi';
import EmotionLog from './EmotionLog';
import LiarResultModal from '../../components/modals/LiarResultModal';
import ScoreModal from '../../components/modals/ScoreModal';
import { VideoOff, MicOff } from 'lucide-react';

const GameRoom = () => {
  const [emotionLogs, setEmotionLogs] = useState<
    Record<string, FaceApiResult | null>
  >({});

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

  const navigation = useNavigate();
  const [myUserName, setMyUserName] = useState<string>('');
  const [_myToken, setMyToken] = useState<string>('');
  const [myRoomCode, setMyRoomCode] = useState('');

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
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const [gameState, _setGameState] = useState<GameState>({
    round: 1,
    turn: 1,
    category: '',
    topic: '',
    message: [],
  });

  const [playerState, _setPlayerState] = useState<PlayerState>({
    currentPlayer: '',
    isLiar: false,
  });

  const OV = useRef<OpenVidu | null>(null);

  const { userInfo } = useAuthStore();
  const { roomCode } = useRoomStore();
  const setRoomCode = useRoomStore((state) => state.setRoomCode);
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
  }, []);

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
        audioSource: undefined,
        videoSource: undefined,
        publishAudio: isAudioEnabled,
        publishVideo: isVideoEnabled,
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
        console.log('게임 종료');
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

    setRoomCode('');
    outGameRoom();
    navigation('/room-list');
  }, [
    session,
    userInfo,
    stompClient,
    clearSubscription,
    clearEmotionSubscription,
    clearChatMessages,
    roomCode,
    navigation,
  ]);

  // 새로고침 시, 세션 연결만 종료
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session) {
        session.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session]);

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
      1: 'col-span-2 col-start-1 row-span-2 row-start-2 max-h-[170px] min-h-[150px] min-w-[180px] max-w-[200px] ml-[18px] mt-[15px]',
      2: 'col-span-2 col-start-6 row-span-2 row-start-2 max-h-[170px] min-h-[150px] min-w-[180px] max-w-[200px] mt-[15px]',
      3: 'col-span-2 col-start-1 row-span-2 row-start-6 max-h-[170px] min-h-[150px] min-w-[180px] max-w-[200px] ml-[18px]',
      4: 'col-span-2 col-start-1 row-span-2 row-start-4 max-h-[170px] min-h-[150px] min-w-[180px] max-w-[200px] ml-[18px]',
      5: 'col-span-2 col-start-6 row-span-2 row-start-4 max-h-[170px] min-h-[150px] min-w-[180px] max-w-[200px]',
    };
    return positions[index as keyof typeof positions] || '';
  };

  const myPosition =
    'col-span-2 col-start-6 row-span-2 row-start-6 max-h-[170px] min-h-[150px] min-w-[180px] max-w-[200px]';

  // STT 결과 처리 함수
  const handleSttResult = (result: SttResult) => {
    console.log('GameRoom received STT result:', result); // 디버깅 로그 추가
    setSttResults((prev) => {
      const newResults = {
        ...prev,
        [result.speaker]: result,
      };
      console.log('Updated STT results:', newResults); // 디버깅 로그 추가
      return newResults;
    });
  };

  // 세션 참가 시 STT 시작
  useEffect(() => {
    if (session && publisher && !sttServiceStarted.current) {
      console.log('Starting STT service for publisher...');
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

  // 구독자들의 오디오 스트림 처리
  useEffect(() => {
    if (!sttServiceStarted.current) return;

    subscribers.forEach((sub) => {
      if (sub.nickname) {
        try {
          sttService.processStreamAudio(sub, (result) => {
            handleSttResult({
              ...result,
              speaker: sub.nickname || 'unknown',
            });
          });
        } catch (error) {
          console.error(
            'Error processing audio stream for subscriber:',
            sub.nickname,
            error
          );
        }
      }
    });
  }, [subscribers]);
  /////////////////////게임 진행 코드 시작/////////////////////

  const chatMessages = useSocketStore((state) => state.chatMessages); // 메세지 변경만 감지

  // 게임 초기화용 상태
  const [currentTurn, setCurrentTurn] = useState(1);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [totalRoundNumber, setTotalRoundNumber] = useState<number>(3);
  // const [participants, setParticipants] = useState<
  //   Array<{ participantNickname: string; order: number }>
  // >([]);
  const [category, setCategory] = useState<string>('');
  const [myWord, setMyWord] = useState<string>('');
  const [hostNickname, setHostNickname] = useState<string>('');
  // 발언 진행 관련
  const [speakingPlayer, setSpeakingPlayer] = useState<string>('');
  const speechTimerRef = useRef<TimerRef>(null);
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
  const [showLiarResultModal, setShowLiarResultModal] = useState(false);
  // liar found 관련
  const [guessedWord, setGuessedWord] = useState<string | null>(null);
  const [showGuessedWord, setShowGuessedWord] = useState(false);
  // 점수 관련
  const [scoreData, setScoreData] = useState<ScoreResponse | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const scoreTimerRef = useRef<TimerRef>(null);

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
        setHostNickname(roomInfoRes.roomInfo.hostNickname);

        console.log('✅playerInfoRes', playerInfoRes);
        console.log('✅roomInfoRes', roomInfoRes);
        console.log('✅세팅 끝');
        console.log('roundNumber', playerInfoRes.data.roundNumber);
        console.log('totalRoundNumber', playerInfoRes.data.totalRoundNumber);
        console.log('word', playerInfoRes.data.word);
        console.log('category', roomInfoRes.roomInfo.category);
        console.log('hostNickname', roomInfoRes.roomInfo.hostNickname);
        console.log('myUserName', myUserName);

        // 라운드 시작 및 턴 시작 API 순차 호출
        if (myUserName === roomInfoRes.roomInfo.hostNickname) {
          try {
            // startRound 먼저 실행
            await startRound(roomCode, playerInfoRes.data.roundNumber);
            console.log('✅startRound 호출 완료');

            // startRound 성공 후 startTurn 실행
            await startTurn(roomCode, playerInfoRes.data.roundNumber);
            console.log('✅startTurn 호출 완료');
          } catch (error) {
            console.error('라운드/턴 시작 중 오류:', error);
          }
        }
      } catch (error) {
        console.error('게임 정보 세팅 중 오류:', error);
      }
    };
    setupGameInfo();
  }, [roomCode, myUserName]);

  // 웹소켓 메세지 채팅에 출력 (chatType 표시 제한 위해 로컬 병행 -> GameChat 컴포넌트에 prop 필요?)
  // const [chatMessages, setChatMessages] = useState<
  //   Array<{ sender: string; content: string; chatType: string }>
  // >([]);

  // 방 바뀌면 채팅창 초기화
  useEffect(() => {
    clearChatMessages();
  }, [roomCode]);

  // 채팅 감지
  useEffect(() => {
    const latest = chatMessages.at(-1);

    // NORMAL일 경우 무시
    if (!latest || latest.chatType == 'NORMAL') return;

    // 개인 발언
    if (latest.chatType == 'TURN_START') {
      console.log('💡TURN_START 수신 확인');
      // 닉네임 파싱
      const nickname = latest.content.split('님의')[0]?.trim();
      if (nickname) {
        setSpeakingPlayer(nickname);
        console.log('🎤 발언자:', nickname);
        // speechTimerRef.current?.startTimer(20);
      }
    }

    // 모든 발언 종료 후 투표 시작
    if (latest.chatType == 'ROUND_END') {
      console.log('💡투표 시작');
      setSpeakingPlayer('');
      setIsVoting(true);
      setSelectedTargetNickname(null);
      // voteTimerRef.current?.startTimer(10); // 10초 안에 투표
    }

    // 모든 플레이어 투표 종료 후
    if (latest.chatType == 'VOTE_SUBMITTED') {
      console.log('💡모든 플레이어 투표 완료');

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
        }
      })();
    }

    // 라이어 제시어 추측 제출 (liar found 모달 이후 로직)
    if (latest.chatType == 'GUESS_SUBMITTED') {
      const match = latest.content.match(/라이어가 (.+)\(을\)를 제출했습니다/);
      const word = match?.[1] || null;

      if (word) {
        console.log('💡라이어가 추측한 제시어', word);
        setGuessedWord(word);
        setShowLiarResultModal(false);
        setShowGuessedWord(true);

        setTimeout(async () => {
          setShowGuessedWord(false);
          await fetchAndShowScore();
        }, 2000);
      }
    }
  }, [chatMessages]);

  // 발언 skip 핸들러
  const handleSkipTurn = async (roomCode: string | null) => {
    if (!roomCode) {
      console.warn('Room code가 없습니다.');
      return;
    }

    try {
      await skipTurn(roomCode);
      console.log('턴이 스킵되었습니다.');
    } catch (error) {
      console.error('턴 스킵 실패:', error);
    }
  };

  useEffect(() => {
    if (speakingPlayer) {
      speechTimerRef.current?.startTimer(20); // 발언자 바뀌면 타이머 재시작
    }
  }, [speakingPlayer]);

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
    setSelectedTargetNickname(null);
  };

  // selectedTargetNickname이 바뀔 때마다 ref에도 저장 (투표 제출 시 최신값 전달)
  useEffect(() => {
    selectedTargetRef.current = selectedTargetNickname;
  }, [selectedTargetNickname]);

  // 투표 타이머 종료 시 최종 투표 제출
  const handleVotingEnd = async () => {
    console.log('투표 제출', currentTurn, selectedTargetRef.current);
    try {
      const target =
        currentTurn >= 3 && !selectedTargetRef.current
          ? myUserName // 3번째 턴에서 투표 안할 경우 본인 투표 (페널티)
          : selectedTargetRef.current;
      await submitVotes(roomCode!, roundNumber, target);
      console.log('투표 완료:', target);
    } catch (err) {
      console.error('투표 제출 실패:', err);
    }
  };

  // liar result modal 이후 로직
  const handleLiarResultModalClose = async () => {
    setShowLiarResultModal(false);

    // skip 모달 이후
    if (voteResult?.skip) {
      if (myUserName === hostNickname) {
        try {
          await endTurn(roomCode!, roundNumber);
          await startTurn(roomCode!, roundNumber);
          console.log('SKIP 이후 다음 턴 시작');
        } catch (e) {
          console.error('다음 턴 시작 실패', e);
        }
      }
      setCurrentTurn((prev) => prev + 1);
    }

    // liar not found 모달 이후
    if (!voteResult?.detected && !voteResult?.skip) {
      await fetchAndShowScore();
    }
  };

  // 점수 조회 및 모달 표시
  const fetchAndShowScore = async () => {
    try {
      const result = await getScores(roomCode!);
      setScoreData(result);
      setShowScoreModal(true);
      scoreTimerRef.current?.startTimer(10);
    } catch (error) {
      console.error('점수 조회 실패:', error);
    }
  };

  useEffect(() => {
    if (showScoreModal && scoreData) {
      scoreTimerRef.current?.startTimer(10);
    }
  }, [showScoreModal, scoreData]);

  // 점수 모달 이후 로직 (마지막 라운드인지 구분)
  const handleScoreTimeEnd = async () => {
    try {
      setShowScoreModal(false);

      // 다음 라운드 세팅
      if (roundNumber < totalRoundNumber) {
        await endRound(roomCode!, roundNumber);
        await setRound(roomCode!);

        const playerInfo = await getPlayerInfo(roomCode!);
        const roomInfo = await getRoomData(roomCode!);

        setRoundNumber(playerInfo.data.roundNumber);
        setMyWord(playerInfo.data.word);
        setCategory(roomInfo.roomInfo.category);
        // setParticipants(playerInfo.data.participants);

        console.log('다음 라운드', playerInfo.data.roundNumber);
        if (myUserName === hostNickname) {
          await startRound(roomCode!, playerInfo.data.roundNumber);
          await startTurn(roomCode!, playerInfo.data.roundNumber);
        }
      }
      // 마지막 라운드 종료 후 게임 종료
      else {
        if (myUserName === hostNickname) {
          await endRound(roomCode!, roundNumber);
          await endGame(roomCode!);
        }
        navigation('/waiting-room');
      }
    } catch (error) {
      console.error('라운드 종료 처리 실패:', error);
    }
  };

  /////////////////////게임 진행 코드 끝/////////////////////

  return (
    <>
      {session !== undefined ? (
        <>
          <div className="w-full h-full flex flex-col px-8">
            <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
              {/* --- 발언시간 --- */}
              <>
                {/* 발언자만 skip 버튼 표시 */}
                {myUserName === speakingPlayer && (
                  <GameButton
                    text="Skip"
                    size="small"
                    variant="neon"
                    onClick={() => handleSkipTurn(roomCode)}
                  />
                )}
                {/* 발언 타이머는 모두에게 표시 */}
                {speakingPlayer && (
                  <Timer
                    ref={speechTimerRef}
                    onTimeEnd={() => console.log('⏰ 타이머 종료')}
                    size="medium"
                  />
                )}
              </>
              {/* --- 투표 시간 --- */}
              {isVoting && (
                <div className="absolute top-6 right-6 z-50 flex gap-2 items-center">
                  {currentTurn < 3 && (
                    <GameButton
                      text="기권"
                      size="small"
                      variant="gray"
                      onClick={handleVoteSkip}
                    />
                  )}
                  <Timer
                    ref={voteTimerRef}
                    onTimeEnd={handleVotingEnd}
                    size="medium"
                  />
                </div>
              )}
            </div>
            <div className="text-white w-full h-full grid grid-cols-7">
              <GameInfo
                round={roundNumber}
                turn={gameState.turn} // 이거 안받는데
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
                // console.log(
                //   `Subscriber ${sub.nickname} audio active:`,
                //   sub.stream.audioActive
                // );
                return (
                  <div
                    key={sub.id || index}
                    onClick={() => isVoting && handleSelectTarget(sub.nickname)}
                    className={`relative ${getParticipantPosition(index + 1, subscribers.length + 1)} 
                    ${isVoting ? 'cursor-pointer' : ''}
                    ${
                      sub.nickname === speakingPlayer
                        ? 'ring-4 ring-point-neon'
                        : ''
                    }`}
                  >
                    {/* 선택된 타겟에 과녁 이미지 */}
                    {selectedTargetNickname === sub.nickname && (
                      <img
                        src="assets/target.png"
                        alt="타겟"
                        className="absolute top-1/2 left-1/2 w-20 h-20 z-50 -translate-x-1/2 -translate-y-1/2"
                      />
                    )}
                    <div className="flex flex-row justify-start items-center gap-2">
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
                          </div>
                          <SttText
                            sttResult={sttResults[sub.nickname || ''] || null}
                            speaker={sub.nickname || 'unknown'}
                          />
                          <div className="w-full min-h-[150px] max-h-[170px] flex items-center justify-center">
                            {sub.stream.videoActive ? (
                              <UserVideoComponent streamManager={sub} />
                            ) : (
                              <div className="w-full h-full flex justify-center">
                                <VideoOff size={50} />
                              </div>
                            )}

                            {/* {sub.isVideoEnabled ? (
                        <UserVideoComponent streamManager={sub} />
                        ) : (
                          <VideoOff />
                        )} */}
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
                  </div>
                );
              })}

              {/* my video */}
              <div
                onClick={() => isVoting && handleSelectTarget(myUserName)}
                className={`relative ${myPosition} 
                ${isVoting ? 'cursor-pointer' : ''}
                ${
                  myUserName === speakingPlayer ? 'ring-4 ring-point-neon' : ''
                }`}
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
                      />
                      <div className="w-full min-h-[150px] max-h-[170px] flex items-center justify-center">
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
                  {/* {publisher && isVideoEnabled ? ( */}
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
              </div>
            </div>

            <div className="mb-2 mt-1 text-white">
              <div className="z-10 justify-center">
                <GameChat />
              </div>
              <GameControls
                isAudioEnabled={isAudioEnabled}
                isVideoEnabled={isVideoEnabled}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onLeaveSession={leaveSession}
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
          opacity: isVoting ? 1 : 0,
          background:
            'radial-gradient(circle at var(--x, 50vw) var(--y, 50vh), transparent 80px, rgba(0,0,0,0.8) 10px)', // 마우스 위치에 원형 밝은 영역 (마우스 주변 80px까지 밝고, 10px까지 fade)
          pointerEvents: 'none',
        }}
      />

      {/* 투표 결과 모달 */}
      {showVoteResultModal && voteResult && (
        <VoteResultModal
          result={voteResult}
          roundNumber={roundNumber}
          totalRoundNumber={totalRoundNumber}
          onClose={() => {
            setShowVoteResultModal(false);
            setShowLiarResultModal(true); // 다음 단계
          }}
        />
      )}

      {/* 라이어 예측 결과 모달 (liar found / liar not found / skip) */}
      {showLiarResultModal && voteResult && (
        <LiarResultModal
          roundNumber={roundNumber}
          totalRoundNumber={totalRoundNumber}
          result={{
            detected: voteResult.detected,
            skip: voteResult.skip,
            liarNickname: voteResult.liarNickname,
          }}
          results={voteResult.results}
          onClose={handleLiarResultModalClose}
          onNext={() => setShowLiarResultModal(false)}
        />
      )}

      {/* 라이어가 추측한 제시어 표시 모달 */}
      {showGuessedWord && guessedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white text-black p-8 rounded-lg text-center shadow-xl">
            <p className="text-2xl font-bold mb-2">
              라이어가 제시어로 제출한 단어는
            </p>
            <p className="text-4xl font-extrabold text-red-600">
              {guessedWord}
            </p>
          </div>
        </div>
      )}

      {/* 점수 */}
      {showScoreModal && scoreData && (
        <>
          <ScoreModal
            type={
              roundNumber < totalRoundNumber
                ? voteResult?.detected
                  ? 'liar-win'
                  : 'civilian-win'
                : 'final-score'
            }
            roundNumber={roundNumber}
            totalRoundNumber={totalRoundNumber}
            scores={scoreData.scores}
            onClose={() => setShowScoreModal(false)}
          />
          <div className="absolute top-4 right-4 z-50">
            <Timer
              ref={scoreTimerRef}
              onTimeEnd={handleScoreTimeEnd}
              size="medium"
            />
          </div>
        </>
      )}
    </>
  );
};

export default GameRoom;
