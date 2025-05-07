import { useEffect, useState, useRef, useCallback } from 'react';
import GameButton from '../../components/common/GameButton';
import { useWebSocketContext } from '../../contexts/WebSocketProvider';
import { useRoomStore } from '../../stores/useRoomStore';
import { VideoOff, Video, Mic, MicOff, Crown, Copy, Check } from 'lucide-react';
import { getRoomData } from '../../services/api/RoomService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { notify } from '../../components/common/Toast';
import { outRoom } from '../../services/api/GameService';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { useSocketStore } from '../../stores/useSocketStore';
import Timer, { TimerRef } from '../../components/common/Timer';

const WaitingRoomContent = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('random');
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
    }>;
  } | null>(null);

  const categories = [
    { label: '랜덤', id: 'random' },
    { label: '물건', id: 'object' },
    { label: '인물', id: 'person' },
    { label: '음식', id: 'food' },
    { label: '나라', id: 'country' },
    { label: '스포츠', id: 'sports' },
    { label: '직업', id: 'job' },
    { label: '동물', id: 'animal' },
    { label: '노래', id: 'song' },
    { label: '장소', id: 'place' },
    { label: '영화/드라마', id: 'movie' },
    { label: '브랜드', id: 'brand' },
  ];

  const { userInfo } = useAuthStore();
  const { roomCode: contextRoomCode, clearRoomCode } = useRoomStore();
  const isHost = userInfo?.nickname === roomData?.roomInfo.hostNickname;

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
  const { subscription, setSubscription, clearSubscription } = useSocketStore();

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
      // 카메라와 마이크 동시에 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: true,
      });

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
        } catch (error) {
          console.error('Failed to fetch room data:', error);
        }
      }
    };

    fetchRoomData();

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
            const message = JSON.parse(frame.body);
            // 중복 메시지 체크
            setChatMessages((prev) => {
              return [...prev, message];
            });

            // 시스템 메시지나 참여자 입/퇴장 메시지일 경우 참여자 정보 최신화
            if (
              // message.chatType === 'SYSTEM' ||
              message.chatType === 'PLAYER_JOIN' ||
              message.chatType === 'PLAYER_LEAVE'
            ) {
              try {
                const response = await getRoomData(contextRoomCode);
                setRoomData(response);
                // 채팅 메시지가 스크롤되도록 약간의 지연 후 스크롤
                setTimeout(() => {
                  if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop =
                      chatContainerRef.current.scrollHeight;
                  }
                }, 100);
              } catch (error) {
                console.error('Failed to fetch room data:', error);
              }
            }
          }
        );

        // 구독 정보를 전역 store에 저장
        setSubscription(newSubscription);

        // 서버에 입장 메시지 전송
        contextSend('입장했습니다.', 'System', 'SYSTEM');
      }
    };

    setupWebSocket();

    // cleanup 함수
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

  // 새 메시지가 올 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // 웹소켓 연결 상태 확인
    if (!isConnected) {
      console.warn('WebSocket이 연결되지 않았습니다.');
      return;
    }

    // 웹소켓으로 메시지 전송
    contextSend(chatInput, userInfo?.nickname || 'Unknown', 'NORMAL');
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
        await outRoom(contextRoomCode);
        // 구독 해제
        if (subscription) {
          subscription.unsubscribe();
          clearSubscription();
        }
        clearRoomCode();
        notify({ type: 'success', text: '방을 나갔습니다.' });
        navigate('/room-list');
      }
    } catch (error) {
      notify({ type: 'error', text: '방을 나가는데 실패했습니다.' });
    }
  };

  // 뒤로가기 이벤트 처리
  useEffect(() => {
    // 현재 페이지를 히스토리에 추가
    window.history.pushState(null, '', window.location.href);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // 뒤로가기 시도 시 현재 페이지를 다시 히스토리에 추가
      window.history.pushState(null, '', window.location.href);
      setIsConfirmModalOpen(true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const timerRef = useRef<TimerRef>(null);
  // 타이머 시작 함수
  const startTimer = () => {
    timerRef.current?.startTimer(60); // 10초 타이머 시작
  };
  // 타이머 종료 시 실행될 콜백
  const handleTimeEnd = () => {
    console.log('타이머가 종료되었습니다!');
    // 여기에 타이머 종료 후 실행할 로직 추가
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden p-10">
      {/* Left section */}
      <div className="flex-1 min-w-0 flex flex-col px-4 h-[calc(100vh-5rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
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
          </div>

          {/* 타이머 추가 */}
          <div className="flex items-center gap-2">
            <Timer ref={timerRef} onTimeEnd={handleTimeEnd} size="large" />
            {/* 테스트용 버튼 */}
            <button
              onClick={startTimer}
              className="bg-primary-500 hover:bg-primary-600 text-white text-xs px-2 py-1 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              테스트용
            </button>
          </div>
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
        <div className="flex mb-4 gap-4">
          {/* Player profile */}
          <div className="flex flex-col">
            <div className="w-48 h-48 xl:w-48 xl:h-48 2xl:w-60 2xl:h-60 rounded-2xl overflow-hidden bg-gray-800 mb-2 relative">
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
          <div className="w-96 h-48 xl:w-[28rem] xl:h-60 2xl:w-[32rem] 2xl:h-60 mb-4 relative flex items-center bg-gray-800/50 backdrop-blur-sm rounded-xl p-3">
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
          <div className="ml-2 bg-gray-800/50 backdrop-blur-sm rounded-xl p-2 w-48 h-48 xl:w-60 xl:h-60 2xl:w-60 2xl:h-60">
            <div className="text-white text-sm mb-1 border-b border-gray-700 pb-1">
              참여자 ({roomData?.participants.length || 0}/6)
            </div>
            <div className="grid grid-cols-2 grid-rows-3 gap-1 h-[calc(100%-24px)]">
              {roomData?.participants.map((participant) => (
                <div
                  key={participant.participantId}
                  className="flex items-center gap-1 hover:bg-gray-700/50 p-1 rounded-lg transition-colors duration-200"
                >
                  {participant.nickName === roomData.roomInfo.hostNickname ? (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <img
                      src="/assets/people-fill.svg"
                      alt="participant"
                      width={14}
                      height={14}
                      className="text-rose-600"
                    />
                  )}
                  <div className="text-white text-xs truncate">
                    {participant.nickName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category section */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <img
                src="/assets/category.svg"
                alt="category"
                width={20}
                height={20}
              />
              <div className="text-primary-600 text-base">제시어 카테고리</div>
            </div>
            <div className="flex gap-2">
              <GameButton
                text="방 나가기"
                size="small"
                onClick={() => setIsConfirmModalOpen(true)}
              />
              {isHost && (
                <GameButton
                  text="게임시작"
                  size="small"
                  onClick={() => navigate('/game-room')}
                />
              )}
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4">
            <div className="grid grid-cols-4 gap-x-4 gap-y-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => isHost && setSelectedCategory(category.id)}
                  className={`text-center text-base cursor-pointer transition-all duration-200
                    ${
                      selectedCategory === category.id
                        ? 'text-rose-500 font-bold scale-105 [text-shadow:_2px_2px_4px_rgba(0,0,0,0.25)]'
                        : isHost
                          ? 'text-gray-300 hover:text-white hover:scale-105'
                          : 'text-gray-500 cursor-not-allowed'
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
      <div className="w-64 min-w-[220px] max-w-xs ml-4 flex flex-col flex-shrink-0">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 flex flex-col h-[calc(100vh-5rem)]">
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
                  <span
                    className={`font-bold text-xs ${
                      msg.sender === 'System'
                        ? 'text-primary-500'
                        : msg.sender === userInfo?.nickname
                          ? 'text-green-500'
                          : 'text-white'
                    }`}
                  >
                    {msg.sender}
                  </span>
                  <span
                    className={`text-xs ${
                      msg.sender === 'System'
                        ? 'text-rose-500'
                        : msg.sender === userInfo?.nickname
                          ? 'text-green-500'
                          : 'text-white'
                    }`}
                  >
                    {msg.content}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={handleSendMessage} className="mt-2">
            <div className="flex gap-1">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="채팅을 입력하세요."
                className="flex-1 h-10 bg-gray-700/50 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="submit"
                className="bg-rose-500 hover:bg-rose-600 text-white text-xs px-2 py-1 rounded-lg transition-colors duration-200"
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
