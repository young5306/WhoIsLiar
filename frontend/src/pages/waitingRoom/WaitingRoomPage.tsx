import { useEffect, useState, useRef, useCallback } from 'react';
import GameButton from '../../components/common/GameButton';
import { useWebSocketContext } from '../../contexts/WebSocketProvider';
import { useRoomStore } from '../../stores/useRoomStore';
import { VideoOff, Video, Mic, MicOff } from 'lucide-react';
import { getRoomData } from '../../services/api/RoomService';
import { useAuthStore } from '../../stores/useAuthStore';

const WaitingRoomContent = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('random');

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
  const [roomData, setRoomData] = useState<{
    roomInfo: {
      roomName: string;
      roomCode: string;
      isSecret: boolean;
      playerCount: number;
      roundCount: number;
      mode: string;
      category: string;
      hostNickname: string;
      status: string;
    };
    participants: Array<{
      participantId: number;
      nickName: string;
      isActive: boolean;
    }>;
  } | null>(null);

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

  const { roomCode: contextRoomCode } = useRoomStore();
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

    // 웹소켓 연결
    let subscription: any = null;

    const setupWebSocket = () => {
      connect(contextRoomCode);

      if (isConnected && stompClient) {
        // 이미 구독이 있다면 해제
        if (subscription) {
          subscription.unsubscribe();
        }

        // 새로운 구독 설정
        subscription = stompClient.subscribe(
          `/topic/room.${contextRoomCode}`,
          (frame) => {
            const message = JSON.parse(frame.body);
            // 중복 메시지 체크
            setChatMessages((prev) => {
              const isDuplicate = prev.some(
                (msg) =>
                  msg.sender === message.sender &&
                  msg.content === message.content &&
                  msg.chatType === message.chatType
              );
              if (isDuplicate) return prev;
              return [...prev, message];
            });
          }
        );

        // 서버에 입장 메시지 전송
        contextSend('입장했습니다.', 'System', 'SYSTEM');
      }
    };

    setupWebSocket();

    // cleanup 함수
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [contextRoomCode, connect, isConnected, stompClient, contextSend]);

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
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden p-20 py-10">
      {/* Left section */}
      <div className="flex-1 flex-col px-10">
        {/* Header */}
        <div className="flex items-center mb-6">
          <div className="text-white headline-large">
            {roomData?.roomInfo.roomName || '게임방'}
          </div>
          <div className="text-white body-medium ml-3">
            Code : {roomData?.roomInfo.roomCode || '로딩중...'}
          </div>
        </div>

        {/* Player count */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <img
              src="/assets/people-fill.svg"
              alt="people-fill"
              width={36}
              height={36}
              className="text-rose-600"
            />
            <div className="text-primary-600 headline-large">플레이어</div>
          </div>
          <div className="text-primary-600 headline-large ml-4">
            {roomData ? `${roomData.roomInfo.playerCount}/6` : '로딩중...'}
          </div>
        </div>

        {/* Player and analysis section */}
        <div className="flex mb-10 gap-6">
          {/* Player profile */}
          <div className="flex flex-col">
            <div className="w-72 h-60 rounded-2xl overflow-hidden bg-gray-800 mb-2 relative">
              {isCameraOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                  onError={(e) => console.error('Video error:', e)}
                  onLoadedMetadata={() => console.log('Video metadata loaded')}
                  onPlay={() => console.log('Video started playing')}
                  onCanPlay={() => console.log('Video can play')}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <VideoOff size={64} className="text-gray-400" />
                </div>
              )}
              <div className="absolute top-3 left-3">
                <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span className="text-white text-base font-['FUNFLOW_SURVIVOR_KR']">
                    {userInfo?.nickname}
                  </span>
                </div>
              </div>
            </div>

            {/* Camera and mic controls */}
            <div className="flex justify-center gap-4 mt-2">
              <button
                className={`rounded-full p-2 transition-colors duration-200 hover:bg-opacity-90 cursor-pointer ${
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
                className={`rounded-full p-2 transition-colors duration-200 hover:bg-opacity-90 cursor-pointer ${
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
          <div className="w-40 h-80 rounded-2xl flex flex-col items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm">
            <div className="w-full h-48 mb-4 relative">
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
                  const x = i * (barWidth + gap) + 5;

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
            <div className="text-center text-rose-600 text-base font-['FUNFLOW_SURVIVOR_KR'] leading-normal space-y-2">
              <p>음성 레벨: {Math.round(audioLevel)}</p>
              <p>{isMicOn ? '마이크 활성화' : '마이크 비활성화'}</p>
              <p>{isCameraOn ? '카메라 활성화' : '카메라 비활성화'}</p>
            </div>
          </div>

          {/* Player list */}
          <div className="ml-6 space-y-4 bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 w-48">
            <div className="text-white text-lg font-['FUNFLOW_SURVIVOR_KR'] mb-3 border-b border-gray-700 pb-2">
              참여자 ({roomData?.participants.length || 0}/6)
            </div>
            {roomData?.participants.map((participant) => (
              <div
                key={participant.participantId}
                className="flex items-center gap-2 hover:bg-gray-700/50 p-2 rounded-lg transition-colors duration-200"
              >
                <img
                  src="/assets/people-fill.svg"
                  alt="people"
                  width={24}
                  height={24}
                  className="text-rose-600"
                />
                <div className="text-white text-lg font-['FUNFLOW_SURVIVOR_KR']">
                  {participant.nickName}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category section */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <img
              src="/assets/category.svg"
              alt="category"
              width={36}
              height={36}
            />
            <div className="text-primary-600 headline-large">
              제시어 카테고리
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
            <div className="grid grid-cols-4 gap-x-12 gap-y-6">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`text-center text-xl font-['FUNFLOW_SURVIVOR_KR'] cursor-pointer  transition-all duration-200
                    ${
                      selectedCategory === category.id
                        ? 'text-rose-500 font-bold scale-110 [text-shadow:_2px_2px_4px_rgba(0,0,0,0.25)]'
                        : 'text-gray-300 hover:text-white hover:scale-105'
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
      <div className="w-1/4 ml-6 flex flex-col">
        <div className="flex-1 bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 flex flex-col">
          <div className="text-white text-lg font-['FUNFLOW_SURVIVOR_KR'] mb-3 border-b border-gray-700 pb-2">
            채팅
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto">
            {chatMessages.map((msg, index) => (
              <div key={index} className="flex flex-col">
                <span
                  className={`font-bold ${
                    msg.sender === 'System' ? 'text-gray-300' : 'text-green-500'
                  }`}
                >
                  {msg.sender}
                </span>
                <span
                  className={
                    msg.sender === 'System' ? 'text-white' : 'text-green-500'
                  }
                >
                  {msg.content}
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="mt-4">
            <div className="flex gap-2">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="채팅을 입력하세요."
                className="flex-1 bg-gray-700/50 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="submit"
                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                전송
              </button>
            </div>
          </form>
        </div>

        {/* Exit / Start button */}
        <div className="flex justify-end mt-4">
          <GameButton
            text="시작"
            onClick={() => {
              // TODO: 게임 시작 요청 시 selectedCategory 포함
              console.log('Selected category:', selectedCategory);
            }}
          />
        </div>
      </div>
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
