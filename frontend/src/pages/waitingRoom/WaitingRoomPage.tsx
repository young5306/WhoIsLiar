import { useEffect, useState, useRef, useCallback } from 'react';
import GameButton from '../../components/common/GameButton';
import { useWebSocketContext } from '../../contexts/WebSocketProvider';
import { useRoomStore } from '../../stores/useRoomStore';
import {
  VideoOff,
  Video,
  Mic,
  MicOff,
  Crown,
  Copy,
  Check,
  Timer,
} from 'lucide-react';
import {
  getRoomData,
  roomReady,
  setRoomCategory,
} from '../../services/api/RoomService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { notify } from '../../components/common/Toast';
import { outRoom, startGame, setRound } from '../../services/api/GameService';
import ConfirmModal from '../../components/modals/ConfirmModal';
import useSocketStore from '../../stores/useSocketStore';
// import Timer, { TimerRef } from '../../components/common/Timer';
import { useMessageStore } from '../../stores/useMessageStore';

const WaitingRoomContent = (): JSX.Element => {
  // const [selectedCategory, setSelectedCategory] = useState<string>('랜덤');

  const [displayCategory, setDisplayCategory] = useState<string>('랜덤');
  const [roomData, setRoomData] = useState<{
    roomInfo: {
      roomName: string;
      roomCode: string;
      isSecret: boolean;
      playerCount: number;
      roundCount: number;
      category: string;
      hostNickname: string;
      status: string;
      videoMode: string;
      gameMode: string;
    };
    participants: Array<{
      participantId: number;
      nickName: string;
      isActive: boolean;
      readyStatus?: boolean;
    }>;
  } | null>(null);

  // 게임 시작 활성화 상태와 참가자 준비 상태 관리
  const [isRoomReady, setIsRoomReady] = useState<boolean>(false);
  const [isUserReady, setIsUserReady] = useState<boolean>(false);

  // isUserReady 상태 변화 추적
  useEffect(() => {
    console.log('isUserReady 상태 변경됨:', isUserReady);
  }, [isUserReady]);

  const categories = [
    { label: '랜덤', id: '랜덤' },
    { label: '물건', id: '물건' },
    { label: '인물', id: '인물' },
    { label: '음식', id: '음식' },
    { label: '나라', id: '나라' },
    { label: '스포츠', id: '스포츠' },
    { label: '직업', id: '직업' },
    { label: '동물', id: '동물' },
    { label: '노래', id: '노래' },
    { label: '장소', id: '장소' },
    { label: '영화/드라마', id: '영화_드라마' },
    { label: '브랜드', id: '브랜드' },
  ];

  const { userInfo } = useAuthStore();
  const { roomCode: contextRoomCode, clearRoomCode } = useRoomStore();
  const isHost = userInfo?.nickname === roomData?.roomInfo.hostNickname;
  const {
    subscription,
    setSubscription,
    clearSubscription,
    addChatMessage,
    emotionSubscription,
    setEmotionSubscription,
    clearEmotionSubscription,
    addEmotionLog,
  } = useSocketStore();

  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [barHeights, setBarHeights] = useState<number[]>(Array(20).fill(2));
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: string; content: string; chatType: string }>
  >([]);
  const [chatInput, setChatInput] = useState<string>('');
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);
  const [showNewMessageAlert, setShowNewMessageAlert] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const beforeUnloadRef = useRef<(e: BeforeUnloadEvent) => void>();

  // 시스템 메시지에서 유저 이름 강조 처리하는 함수
  const highlightUsername = (content: string) => {
    // "xx님이" 패턴을 찾아서 강조 처리
    const usernameRegex = /(\S+)님이/;
    const match = content.match(usernameRegex);

    if (match && match[1]) {
      const username = match[1];
      const parts = content.split(username);

      return (
        <>
          {parts[0]}
          <span className="text-white font-bold">{username}</span>
          {parts[1]}
        </>
      );
    }

    return content;
  };

  const updateVitalData = useCallback(() => {
    animationFrameRef.current = requestAnimationFrame(updateVitalData);
  }, []);

  // 컴포넌트 마운트 시 애니메이션 시작
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateVitalData);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateVitalData]);

  const setupAudioAnalyser = (stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 1024;
    analyserRef.current.smoothingTimeConstant = 0.8;
    source.connect(analyserRef.current);

    const updateAudioLevel = () => {
      if (!analyserRef.current || !isMicOn) {
        setAudioLevel(0);
        // 마이크가 꺼지면 바 높이를 최소값으로 설정
        setBarHeights((prev) => prev.map(() => 2));
        return;
      }
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      // 주파수 대역을 나누어 더 세밀한 분석
      const bass = dataArray.slice(0, 10).reduce((a, b) => a + b) / 10;
      const mid = dataArray.slice(10, 100).reduce((a, b) => a + b) / 90;
      const treble =
        dataArray.slice(100).reduce((a, b) => a + b) / (dataArray.length - 100);

      // 가중치를 적용한 평균 계산
      const weightedAverage = bass * 0.4 + mid * 0.4 + treble * 0.2;
      setAudioLevel(weightedAverage);

      // 각 주파수 영역의 데이터를 기반으로 바 높이 직접 설정
      const newBarHeights = Array(20)
        .fill(0)
        .map((_, i) => {
          // 여러 주파수 영역에서 데이터 추출
          const freqIndex = Math.floor(
            i * (analyserRef.current!.frequencyBinCount / 40)
          );
          const freqValue = dataArray[freqIndex] || 0;

          // 직접적인 주파수 값을 사용하여 높이 계산 (0-40 범위로)
          return Math.max(2, (freqValue / 255) * 40);
        });

      setBarHeights(newBarHeights);
      requestAnimationFrame(updateAudioLevel);
    };
    updateAudioLevel();
  };

  const toggleMic = async () => {
    if (isMicOn) {
      if (mediaStreamRef.current) {
        const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.stop();
          mediaStreamRef.current.removeTrack(audioTrack);
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsMicOn(false);
      setAudioLevel(0);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        if (mediaStreamRef.current) {
          stream.getAudioTracks().forEach((track) => {
            mediaStreamRef.current?.addTrack(track);
          });
        } else {
          mediaStreamRef.current = stream;
        }
        setupAudioAnalyser(stream);
        setIsMicOn(true);
      } catch (error) {
        console.error('Microphone access failed:', error);
      }
    }
  };

  const checkMediaDevices = async () => {
    try {
      // 카메라와 마이크를 개별적으로 요청
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // 스트림 병합
      const stream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      // 카메라 설정
      if (videoRef.current) {
        // 기존 스트림 정리
        if (videoRef.current.srcObject) {
          const oldStream = videoRef.current.srcObject as MediaStream;
          oldStream.getTracks().forEach((track) => track.stop());
        }

        // 새 스트림 설정
        videoRef.current.srcObject = stream;
        mediaStreamRef.current = stream;

        // 비디오 재생 시작
        try {
          await videoRef.current.play();
          setIsCameraOn(true);
        } catch (error) {
          console.error('Failed to start video playback:', error);
        }
      }

      // 오디오 설정
      setupAudioAnalyser(stream);
      setIsMicOn(true);
    } catch (error) {
      console.error('Media devices check failed:', error);
      // 디바이스 접근 실패 시 사용자에게 알림
      notify({
        type: 'error',
        text: '카메라나 마이크에 접근할 수 없습니다. 디바이스가 연결되어 있는지 확인해주세요.',
      });
    }
  };

  // 비디오 요소가 마운트될 때 실행되는 useEffect
  useEffect(() => {
    if (videoRef.current && isCameraOn && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [isCameraOn]);

  // 컴포넌트 마운트 시 자동으로 미디어 장치 초기화
  useEffect(() => {
    const initializeMedia = async () => {
      await checkMediaDevices();
    };
    initializeMedia();

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []); // 빈 의존성 배열로 컴포넌트 마운트 시 한 번만 실행

  const navigate = useNavigate();
  const {
    connect,
    send: contextSend,
    isConnected,
    stompClient,
  } = useWebSocketContext();

  useEffect(() => {
    const fetchRoomData = async () => {
      if (contextRoomCode) {
        try {
          const response = await getRoomData(contextRoomCode);
          setRoomData(response);
          setDisplayCategory(response.roomInfo.category || '랜덤');

          // 방 데이터를 성공적으로 가져온 후에 웹소켓 연결 시도
          setupWebSocket();
        } catch (error) {
          console.error('Failed to fetch room data:', error);
          notify({ type: 'error', text: '방 정보를 가져오는데 실패했습니다.' });
        }
      }
    };

    if (!contextRoomCode) {
      console.warn('roomCode가 없습니다.');
      return;
    }

    const setupWebSocket = () => {
      connect(contextRoomCode);

      if (isConnected && stompClient) {
        // 이미 구독이 있다면 해제
        if (subscription) {
          subscription.unsubscribe();
          clearSubscription();
        }

        // 새로운 구독 설정
        const newSubscription = stompClient.subscribe(
          `/topic/room.${contextRoomCode}`,
          async (frame) => {
            // JSON 파싱 시도, 실패할 경우 원본 문자열 사용
            let message;
            try {
              message = JSON.parse(frame.body);
            } catch (error) {
              console.log('JSON 파싱 실패, 원본 사용:', frame.body);
              // 단순 문자열인 경우 content 필드에 원본 값 설정
              message = {
                chatType: 'SIMPLE_MESSAGE',
                content: frame.body,
                sender: 'System',
              };
            }

            // 채팅 메시지를 전역 상태에 추가
            addChatMessage(message);
            // 중복 메시지 체크
            setChatMessages((prev) => {
              // CATEGORY_SELECTED, READY_STATUS, ROOM_READY_STATUS 메시지는 채팅창에 표시하지 않음
              if (
                message.chatType === 'CATEGORY_SELECTED' ||
                message.chatType === 'READY_STATUS' ||
                message.chatType === 'ROOM_READY_STATUS'
              ) {
                return prev;
              }
              return [...prev, message];
            });

            // 카테고리 선택 메시지 처리
            if (message.chatType === 'CATEGORY_SELECTED') {
              setDisplayCategory(message.content);
            }

            // 게임 시작 메시지 처리
            if (message.chatType === 'GAME_START') {
              if (contextRoomCode && !isHost) {
                navigate('/game-room');
              }
            }

            if (message.chatType === 'ROOM_READY_STATUS') {
              console.log('방 준비 상태 메시지 수신:', message.content);

              // 이전 상태와 새 상태 비교
              const newReadyStatus = message.content === 'TRUE';

              // 방장에게만 상태 변화 알림 표시
              if (isHost) {
                // 인원 조건 (3명 이상)도 함께 확인
                const hasEnoughPlayers =
                  roomData &&
                  roomData.participants &&
                  roomData.participants.length >= 3;

                if (newReadyStatus && hasEnoughPlayers) {
                  console.log(
                    '🟢 방이 게임 시작 가능 상태로 변경됨 (인원: ' +
                      (roomData?.participants?.length || 0) +
                      '명)'
                  );
                  if (!isRoomReady) {
                    // 상태가 변경될 때만 알림
                    notify({
                      type: 'success',
                      text: '모든 플레이어가 준비되었습니다. 게임을 시작할 수 있습니다.',
                    });
                  }
                } else {
                  console.log('🔴 방이 게임 시작 불가능 상태로 변경됨');
                  if (!newReadyStatus) {
                    console.log('- 이유: 준비되지 않은 플레이어 있음');
                  }
                  if (!hasEnoughPlayers) {
                    console.log(
                      '- 이유: 플레이어 수 부족 (현재: ' +
                        (roomData?.participants?.length || 0) +
                        '명, 필요: 3명 이상)'
                    );
                  }

                  if (isRoomReady) {
                    // 상태가 변경될 때만 알림
                    const reason = !newReadyStatus
                      ? '준비되지 않은 플레이어가 있습니다.'
                      : '플레이어가 3명 이상 필요합니다.';

                    notify({
                      type: 'warning',
                      text: `게임을 시작할 수 없습니다. ${reason}`,
                    });
                  }
                }
              }

              // 상태 업데이트
              setIsRoomReady(newReadyStatus);
            }

            // 사용자 준비 상태 메시지 처리
            if (message.chatType === 'READY_STATUS') {
              // 메시지 로그 추가
              console.log('READY_STATUS 메시지 원본:', message);
              console.log('sender:', message.sender);
              console.log('content:', message.content);

              const nickname = message.sender;
              const status = message.content;

              // 현재 사용자의 준비 상태일 경우만 UI 업데이트
              if (nickname === userInfo?.nickname) {
                console.log(`내 준비 상태 변경 전: ${isUserReady}`);

                // 서버에서 온 메시지로 준비 상태 설정 - "준비 완료" 또는 "준비 취소"
                const newReadyStatus = status === '준비 완료';
                setIsUserReady(newReadyStatus);

                console.log(`내 준비 상태 변경 후, 상태값: ${status}`);
              } else {
                console.log(
                  `다른 사용자 준비 상태 변경: ${nickname}, ${status}`
                );
              }

              // 다른 사용자 포함한 모든 참가자 정보 업데이트
              try {
                const response = await getRoomData(contextRoomCode);
                setRoomData(response);
              } catch (error) {
                console.error('방 정보 최신화 실패:', error);
              }
            }

            // 시스템 메시지나 참여자 입/퇴장 메시지일 경우 참여자 정보 최신화
            if (
              message.chatType === 'PLAYER_JOIN' ||
              message.chatType === 'PLAYER_LEAVE'
            ) {
              console.log(`${message.chatType} 메시지 수신:`, message);

              if (message.chatType === 'PLAYER_LEAVE') {
                leaveMessageState(true);
                console.log('플레이어 퇴장 감지:', Date.now());
              }

              // 약간의 지연 후 방 정보 갱신 (서버 데이터 업데이트 대기)
              setTimeout(async () => {
                try {
                  console.log('방 정보 갱신 시작');
                  const response = await getRoomData(contextRoomCode);
                  console.log('방 정보 갱신 결과:', response);
                  setRoomData(response);

                  // 채팅 메시지가 스크롤되도록 약간의 지연 후 스크롤
                  setTimeout(() => {
                    if (chatContainerRef.current) {
                      chatContainerRef.current.scrollTop =
                        chatContainerRef.current.scrollHeight;
                    }
                  }, 100);
                } catch (error) {
                  console.error('방 정보 갱신 실패:', error);
                  notify({
                    type: 'error',
                    text: '방 정보를 가져오는데 실패했습니다.',
                  });
                }
              }, 300); // 서버 데이터가 업데이트될 시간을 주기 위해 지연
            }
          }
        );

        // emotion 토픽 구독
        const newEmotionSubscription = stompClient.subscribe(
          `/topic/room.${contextRoomCode}.emotion`,
          (frame) => {
            // JSON 파싱 시도, 실패할 경우 원본 문자열 사용
            let message;
            try {
              message = JSON.parse(frame.body);
            } catch (error) {
              console.log('JSON 파싱 실패, 원본 사용:', frame.body);
              // 단순 문자열인 경우 content 필드에 원본 값 설정
              message = {
                chatType: 'SIMPLE_MESSAGE',
                content: frame.body,
                sender: 'System',
              };
            }
            // emotion 메시지 처리 로직 추가
            addEmotionLog(message);
            // console.log('Emotion message received:', message);
          }
        );

        // 구독 정보를 전역 store에 저장
        setSubscription(newSubscription);
        setEmotionSubscription(newEmotionSubscription);

        // 서버에 입장 메시지 전송
        contextSend('입장했습니다.', 'System', 'SYSTEM');
      }
    };

    fetchRoomData();
    return () => {
      // 구독은 해제하지 않음 (게임방에서도 사용하기 위해)
    };
  }, [
    contextRoomCode,
    connect,
    isConnected,
    stompClient,
    contextSend,
    clearSubscription,
  ]);

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (mediaStreamRef.current) {
        const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
        }
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
        });

        mediaStreamRef.current = stream;
        setIsCameraOn(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (error) {
            console.error('Failed to start video playback:', error);
          }
        }
      } catch (error) {
        console.error('Camera access failed:', error);
      }
    }
  };

  // 새 메시지가 올 때마다 스크롤을 맨 아래로 이동하는 useEffect 수정
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;

      // 사용자가 스크롤을 위로 올린 상태인지 확인
      const isScrolledUp =
        container.scrollHeight - container.scrollTop - container.clientHeight >
        30;

      if (!userScrolled || !isScrolledUp) {
        // 사용자가 스크롤을 올리지 않았거나, 이미 맨 아래에 있는 경우 스크롤 다운
        container.scrollTop = container.scrollHeight;
        setUserScrolled(false);
        setShowNewMessageAlert(false);
        setNewMessageCount(0);
      } else {
        // 사용자가 스크롤을 올린 상태이면 새 메시지 알림 표시
        setShowNewMessageAlert(true);
        setNewMessageCount((prev) => prev + 1);
      }
    }
  }, [chatMessages]);

  // 채팅 컨테이너에 스크롤 이벤트 리스너 추가 (chatContainerRef 생성 이후에 추가)
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        30;

      if (isAtBottom) {
        // 사용자가 맨 아래로 스크롤했으면 상태 초기화
        setUserScrolled(false);
        setShowNewMessageAlert(false);
        setNewMessageCount(0);
      } else {
        // 사용자가 스크롤을 위로 올린 상태
        setUserScrolled(true);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 새 메시지로 스크롤하는 함수 추가
  const scrollToLatestMessage = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
      setShowNewMessageAlert(false);
      setNewMessageCount(0);
      setUserScrolled(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // 채팅 메시지 길이 제한 (100자)
    if (chatInput.length > 100) {
      notify({
        type: 'warning',
        text: '채팅 메시지는 100자를 초과할 수 없습니다.',
      });
      return;
    }

    // 특수문자 제한 (이모지, HTML 태그 등)
    const sanitizedInput = chatInput.replace(/[<>]/g, '');
    if (sanitizedInput !== chatInput) {
      notify({
        type: 'warning',
        text: '특수문자 <, >는 사용할 수 없습니다.',
      });
      return;
    }

    // 웹소켓 연결 상태 확인
    if (!isConnected) {
      console.warn('WebSocket이 연결되지 않았습니다.');
      return;
    }

    // 웹소켓으로 메시지 전송
    contextSend(sanitizedInput, userInfo?.nickname || 'Unknown', 'NORMAL');
    setChatInput('');

    // 메시지 전송 후 스크롤을 맨 아래로 이동
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const copyRoomCode = () => {
    if (roomData?.roomInfo.roomCode) {
      navigator.clipboard.writeText(roomData.roomInfo.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      if (contextRoomCode) {
        // 방 나가기 API 호출
        const response = await outRoom(contextRoomCode);

        // API 호출이 성공한 경우에만 네비게이션 실행
        if (response) {
          // 구독 해제
          if (subscription) {
            subscription.unsubscribe();
            clearSubscription();
          }
          if (emotionSubscription) {
            emotionSubscription.unsubscribe();
            clearEmotionSubscription();
          }

          // 룸 스토어 초기화
          clearRoomCode();
          setRoomData(null);

          // 웹소켓 연결 해제
          if (isConnected && stompClient?.connected) {
            stompClient.deactivate();
          }

          notify({ type: 'success', text: '방을 나갔습니다.' });
          navigate('/room-list');
        }
      }
    } catch (error) {
      notify({ type: 'error', text: '방을 나가는데 실패했습니다.' });
    }
  };

  // const timerRef = useRef<TimerRef>(null);
  // // 타이머 시작 함수
  // const startTimer = () => {
  //   timerRef.current?.startTimer(60); // 10초 타이머 시작
  // };
  // // 타이머 종료 시 실행될 콜백
  // const handleTimeEnd = () => {
  //   console.log('타이머가 종료되었습니다!');
  //   // 여기에 타이머 종료 후 실행할 로직 추가
  // };

  const handleCategorySelect = async (categoryId: string) => {
    if (isHost && contextRoomCode) {
      try {
        await setRoomCategory(contextRoomCode, categoryId);
        // setSelectedCategory(categoryId);
        notify({ type: 'success', text: '카테고리가 변경되었습니다.' });
      } catch (error) {
        notify({ type: 'error', text: '카테고리 변경에 실패했습니다.' });
      }
    }
  };

  const handleStartGame = async () => {
    try {
      if (contextRoomCode) {
        // setRound 먼저 실행하고 응답 대기
        await setRound(contextRoomCode);
        console.log('✅setRound 완료');

        // setRound 성공 후 startGame 실행
        await startGame(contextRoomCode);
        console.log('✅startGame 완료');

        // 모든 API 호출이 성공적으로 완료된 후 페이지 이동
        navigate('/game-room');
      }
    } catch (error) {
      console.error('게임 시작 중 오류:', error);
      notify({
        type: 'error',
        text: '게임 시작에 실패했습니다.',
      });
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      clearRoomCode(); // roomCode 초기화
      return (e.returnValue = '');
    };

    // 뒤로가기 버튼 클릭시 경고창 방지를 위함
    beforeUnloadRef.current = handleBeforeUnload;

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [clearRoomCode]);

  // 플레이어가 뒤로가기 버튼 누른 경우
  useEffect(() => {
    history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      const shouldLeave = window.confirm('대기방에서 나가시겠습니까?');
      if (shouldLeave) {
        if (beforeUnloadRef.current) {
          window.removeEventListener('beforeunload', beforeUnloadRef.current);
        }
        clearRoomCode();
        window.location.href = '/room-list';
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [clearRoomCode]);

  // 플레이어가 중간에 퇴장하는 경우
  const leaveMessageState = useMessageStore((state) => state.setLeaveMessageOn);

  const handleReady = async () => {
    if (contextRoomCode) {
      try {
        await roomReady(contextRoomCode);
        // 서버로부터 READY_STATUS 웹소켓 메시지를 통해 상태 업데이트 받음
      } catch (error) {
        console.error('준비 상태 변경 실패:', error);
        notify({ type: 'error', text: '준비 상태 변경에 실패했습니다.' });
      }
    }
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden px-[4%]">
      {/* Left section */}
      <div className="flex-1 min-w-0 flex flex-col px-[1%] h-[98vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-[1vh]">
          <div className="flex items-center gap-4">
            <div className="text-white text-2xl font-bold bg-gray-800/50 backdrop-blur-sm px-5 py-2 rounded-xl">
              {roomData?.roomInfo.roomName || '게임방'}
            </div>
            <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="text-white text-base">
                Code: {roomData?.roomInfo.roomCode || '로딩중...'}
              </span>
              <button
                onClick={copyRoomCode}
                className="text-white hover:text-rose-500 transition-colors duration-200 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            {/* 화면 모드 표시 */}
            <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg">
              <img
                src={`/assets/${roomData?.roomInfo.videoMode === 'VIDEO' ? 'videoMode' : 'blindMode'}.png`}
                alt="video-mode"
                width={28}
                height={28}
                className="text-rose-600"
              />
              <span className="text-white text-base font-medium">
                {roomData?.roomInfo.videoMode === 'VIDEO'
                  ? '비디오 모드'
                  : '블라인드 모드'}
              </span>
            </div>
            {/* 게임 모드 표시 */}
            <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg">
              <img
                src={`/assets/${roomData?.roomInfo.gameMode === 'DEFAULT' ? 'defaultMode' : 'foolMode'}.png`}
                alt="game-mode"
                width={28}
                height={28}
                className="text-rose-600"
              />
              <span className="text-white text-base font-medium">
                {roomData?.roomInfo.gameMode === 'DEFAULT'
                  ? '일반 모드'
                  : '바보 모드'}
              </span>
            </div>
            {/* 라운드 정보 표시 */}
            <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Timer className="w-7 h-7 text-rose-600" />
              <span className="text-white text-base font-medium">
                {roomData?.roomInfo.roundCount} 라운드
              </span>
            </div>
            {/* 제시어 카테고리 표시 */}
            <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-rose-500 text-sm">제시어</span>
                <span className="text-rose-500 text-base font-bold">
                  {displayCategory}
                </span>
              </div>
            </div>
          </div>

          {/* <div className="flex items-center gap-2">
            <Timer ref={timerRef} onTimeEnd={handleTimeEnd} size="large" />
            <button
              onClick={startTimer}
              className="bg-primary-500 hover:bg-primary-600 text-white text-xs px-2 py-1 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              테스트용
            </button>
          </div> */}
        </div>

        {/* Player count */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <img
              src="/assets/people-fill.svg"
              alt="people-fill"
              width={20}
              height={20}
              className="text-rose-600"
            />
            <div className="text-primary-600 text-base">플레이어</div>
          </div>
          <div className="text-primary-600 text-lg ml-3">
            {roomData ? `${roomData.roomInfo.playerCount}/6` : '로딩중...'}
          </div>
        </div>

        {/* Player and analysis section */}
        <div className="flex mb-[2vh] gap-[1vw]">
          {/* Player profile */}
          <div className="flex flex-col">
            <div className="w-[20vh] h-[20vh] xl:w-[25vh] xl:h-[25vh] 2xl:w-[30vh] 2xl:h-[30vh] rounded-2xl overflow-hidden bg-gray-800 mb-[1vh] relative">
              {isCameraOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <VideoOff size={32} className="text-gray-400" />
                </div>
              )}
              <div className="absolute top-1 left-1">
                <div className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  <span className="text-white text-xs">
                    {userInfo?.nickname}
                  </span>
                </div>
              </div>
            </div>

            {/* Camera and mic controls */}
            <div className="flex justify-center gap-3 mt-2">
              <button
                className={`rounded-full p-2.5 transition-colors duration-200 hover:bg-opacity-90 cursor-pointer ${
                  isCameraOn
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-700/80 hover:bg-gray-600'
                }`}
                onClick={toggleCamera}
              >
                {isCameraOn ? (
                  <Video className="w-6 h-6 text-white" />
                ) : (
                  <VideoOff className="w-6 h-6 text-white" />
                )}
              </button>
              <button
                className={`rounded-full p-2.5 transition-colors duration-200 hover:bg-opacity-90 cursor-pointer ${
                  isMicOn
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-700/80 hover:bg-gray-600'
                }`}
                onClick={toggleMic}
              >
                {isMicOn ? (
                  <Mic className="w-6 h-6 text-white" />
                ) : (
                  <MicOff className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Emotion analysis box */}
          <div className="w-[40vw] h-[20vh] xl:w-[45vw] xl:h-[25vh] 2xl:w-[50vw] 2xl:h-[30vh] mb-[2vh] relative flex items-center bg-gray-800/50 backdrop-blur-sm rounded-xl p-3">
            {/* Audio visualization */}
            <div className="w-2/3 h-full relative">
              <svg
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                {/* 그리드 패턴 */}
                <pattern
                  id="smallGrid"
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 8 0 L 0 0 0 8"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="0.5"
                  />
                </pattern>
                <rect width="100" height="100" fill="url(#smallGrid)" />

                {/* 중심선 */}
                <line
                  x1="0"
                  y1="50"
                  x2="100"
                  y2="50"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="0.5"
                />

                {/* 주파수 막대 */}
                {barHeights.map((height, i) => {
                  const barWidth = 3;
                  const gap = 2;
                  const x = i * (barWidth + gap);

                  return (
                    <rect
                      key={i}
                      x={x}
                      y={50 - height}
                      width={barWidth}
                      height={height * 2}
                      fill={`rgba(255, 45, 85, ${0.5 + height / 80})`}
                      rx="1"
                    />
                  );
                })}

                {/* 파동 효과 */}
                <circle
                  cx="50"
                  cy="50"
                  r={isMicOn ? Math.min(audioLevel * 0.7, 30) : 0}
                  fill="none"
                  stroke="rgba(255, 45, 85, 0.4)"
                  strokeWidth="0.5"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={isMicOn ? Math.min(audioLevel * 1.2, 50) : 0}
                  fill="none"
                  stroke="rgba(255, 45, 85, 0.2)"
                  strokeWidth="0.5"
                />
              </svg>
            </div>

            {/* Status text */}
            <div className="w-1/3 pl-4 text-rose-600 body-medium space-y-2">
              <p>음성 레벨: {Math.round(audioLevel)}</p>
              <p>{isMicOn ? '마이크 활성화' : '마이크 비활성화'}</p>
              <p>{isCameraOn ? '카메라 활성화' : '카메라 비활성화'}</p>
            </div>
          </div>

          {/* Player list */}
          <div className="ml-[1vw] bg-gray-800/50 backdrop-blur-sm rounded-xl p-2 w-[20vh] h-[20vh] xl:w-[25vh] xl:h-[25vh] 2xl:w-[30vh] 2xl:h-[30vh]">
            {' '}
            <div className="text-white text-sm mb-1 border-b border-gray-700 pb-1">
              {' '}
              참여자 ({roomData?.participants.length || 0}/6){' '}
            </div>{' '}
            <div className="grid grid-cols-2 grid-rows-3 gap-1 h-[calc(100%-24px)]">
              {roomData?.participants.map(
                (participant: {
                  participantId: number;
                  nickName: string;
                  isActive: boolean;
                  readyStatus?: boolean;
                }) => (
                  <div
                    key={participant.participantId}
                    className={`flex items-center justify-center gap-1 hover:bg-gray-700/50 p-1 rounded-lg transition-colors duration-200 relative ${
                      participant.readyStatus
                        ? 'bg-gradient-to-r from-green-600/20 to-green-500/30 border border-green-500/30'
                        : ''
                    }`}
                  >
                    {participant.nickName === roomData.roomInfo.hostNickname ? (
                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    ) : (
                      <img
                        src="/assets/people-fill.svg"
                        alt="participant"
                        width={14}
                        height={14}
                        className="text-rose-600 flex-shrink-0"
                      />
                    )}
                    <div className="text-white text-xs truncate">
                      {participant.nickName}
                    </div>
                    {participant.readyStatus && (
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 shadow-lg animate-pulse">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                )
              )}
            </div>{' '}
          </div>
        </div>

        {/* Category section */}
        <div className="flex flex-col">
          <div className="flex items-center mb-[2vh] justify-between">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/category.svg"
                  alt="category"
                  width={20}
                  height={20}
                />
                <div className="text-primary-600 text-base">
                  제시어 카테고리
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {' '}
              <GameButton
                text="방 나가기"
                variant="gray"
                size="small"
                onClick={() => setIsConfirmModalOpen(true)}
              />{' '}
              {isHost ? (
                <div className="relative group">
                  {' '}
                  <GameButton
                    text="게임시작"
                    size="small"
                    onClick={handleStartGame}
                    disabled={
                      !isRoomReady ||
                      !roomData ||
                      !roomData.participants ||
                      roomData.participants.length < 3
                    }
                    variant={
                      isRoomReady &&
                      roomData &&
                      roomData.participants &&
                      roomData.participants.length >= 3
                        ? 'default'
                        : 'gray'
                    }
                  />{' '}
                  {/* 버튼이 비활성화된 경우에만 표시되는 툴팁 */}{' '}
                  {(!isRoomReady ||
                    !roomData ||
                    !roomData.participants ||
                    roomData.participants.length < 3) && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max px-3 py-2 bg-black/80 text-white text-xs rounded-lg shadow-lg invisible group-hover:visible transition-opacity opacity-0 group-hover:opacity-100 z-10">
                      {' '}
                      {roomData &&
                      roomData.participants &&
                      roomData.participants.length < 3 ? (
                        <div className="flex flex-col items-center">
                          {' '}
                          <span className="whitespace-nowrap">
                            인원이 부족합니다!
                          </span>{' '}
                          <span className="whitespace-nowrap">
                            최소 3명 이상 필요 (현재:{' '}
                            {roomData.participants.length}명)
                          </span>{' '}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          {' '}
                          <span className="whitespace-nowrap">
                            모든 플레이어가 준비되어야 합니다!
                          </span>{' '}
                        </div>
                      )}{' '}
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-black/80"></div>{' '}
                    </div>
                  )}{' '}
                </div>
              ) : (
                <GameButton
                  text={isUserReady ? '준비완료' : '게임준비'}
                  size="small"
                  onClick={handleReady}
                  variant={isUserReady ? 'success' : 'primary'}
                />
              )}
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4">
            <div className="grid grid-cols-4 gap-x-4 gap-y-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`text-center text-base  transition-all duration-200
                    ${
                      category.id === displayCategory
                        ? 'text-rose-500 font-bold scale-105 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg [text-shadow:_2px_2px_4px_rgba(0,0,0,0.25)]'
                        : isHost
                          ? 'text-gray-300 cursor-pointer hover:text-white hover:scale-105 hover:bg-gray-700/50 px-3 py-1.5 rounded-lg'
                          : 'text-gray-500'
                    }
                  `}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right section - Chat */}
      <div className="w-[20vw] min-w-[10vw] max-w-[25vw] ml-[1vw] flex flex-col flex-shrink-0">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 flex flex-col h-[92vh]">
          <div className="text-white text-sm mb-2 border-b border-gray-700 pb-1">
            채팅
          </div>
          <div
            className="relative flex-1"
            style={{ height: 'calc(100% - 80px)' }}
          >
            <div
              ref={chatContainerRef}
              className="absolute inset-0 space-y-1 overflow-y-auto pr-1 custom-scrollbar"
            >
              {chatMessages.map((msg, index) => (
                <div key={index} className="flex flex-col">
                  {msg.sender === 'SYSTEM' ? (
                    <div className="flex justify-center my-2">
                      <span className="text-purple-400 text-xs font-medium bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full shadow-lg">
                        {highlightUsername(msg.content)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`flex flex-col ${msg.sender === userInfo?.nickname ? 'items-end' : 'items-start'} mb-1`}
                      >
                        <span
                          className={`text-[10px] text-gray-400 mb-0.5 ${
                            msg.sender === userInfo?.nickname
                              ? 'text-green-400'
                              : ''
                          }`}
                        >
                          {msg.sender}
                        </span>
                        <div
                          className={`px-3 py-1.5 rounded-2xl max-w-[85%] ${
                            msg.sender === userInfo?.nickname
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-gray-700/50 text-white'
                          }`}
                        >
                          <span className="text-sm break-words">
                            {msg.content}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {showNewMessageAlert && (
              <button
                onClick={scrollToLatestMessage}
                className="cursor-pointer absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-primary-600 hover:bg-primary-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg transition-all duration-200 flex items-center gap-1 z-10 animate-pulse"
              >
                <span>
                  새 메시지 {newMessageCount > 0 && `(${newMessageCount})`}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5M5 12l7 7 7-7" />
                </svg>
              </button>
            )}
          </div>
          <form onSubmit={handleSendMessage} className="mt-2">
            <div className="flex gap-1">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => {
                  // 입력값 길이 제한
                  if (e.target.value.length <= 100) {
                    setChatInput(e.target.value);
                  }
                }}
                placeholder="채팅을 입력하세요. (최대 100자)"
                className="flex-1 h-10 bg-gray-700/50 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-rose-500"
                maxLength={100}
              />
              <button
                type="submit"
                className="bg-primary-500 hover:bg-primary-600 text-white text-xs px-2 py-1 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                전송
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 확인 모달 */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleLeaveRoom}
        title="방 나가기"
        message="정말로 방을 나가시겠습니까?"
      />
    </div>
  );
};

const WaitingRoomPage = () => {
  const { roomCode } = useRoomStore();

  if (!roomCode) {
    return <div>방 코드가 없습니다.</div>;
  }

  return <WaitingRoomContent />;
};

export default WaitingRoomPage;
