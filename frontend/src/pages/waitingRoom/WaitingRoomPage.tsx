import { useEffect, useState, useRef, useCallback } from 'react';
import GameButton from '../../components/common/GameButton';
import { useWebSocketContext } from '../../contexts/WebSocketProvider';
import { useRoomStore } from '../../stores/useRoomStore';
// import { useAuthStore } from '../../stores/useAuthStore';
import { VideoOff, Video, Mic, MicOff } from 'lucide-react';
import { getRoomData } from '../../services/api/RoomService';

const WaitingRoomContent = () => {
  const categories = [
    { label: '랜덤', id: 'random' },
    { label: '물건', id: 'object' },
    { label: '인물', id: 'person' },
    { label: '음식', id: 'food' },
    { label: '나라', id: 'country' },
    { label: '스포츠', id: 'sports' },
    { label: '직업', id: 'job' },
    { label: '동물', id: 'animal', highlight: true },
    { label: '노래', id: 'song' },
    { label: '장소', id: 'place' },
    { label: '영화/드라마', id: 'movie' },
    { label: '브랜드', id: 'brand' },
  ];

  // const { userInfo } = useAuthStore();
  // console.log('userInfo', userInfo); // Zustand로 가져오기

  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  // eslint-disable-next-line
  const [vitalData, setVitalData] = useState<number[]>(Array(100).fill(50));
  const [barHeights, setBarHeights] = useState<number[]>(Array(20).fill(2));
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: string; content: string }>
  >([]);

  const updateVitalData = useCallback(() => {
    setVitalData((prevData) => {
      // 이전 데이터를 왼쪽으로 한 칸씩 이동
      const newData = [...prevData.slice(1), 50];

      // 새로운 값 생성 (심전도 스타일)
      if (isMicOn && audioLevel > 5) {
        const lastIndex = newData.length - 1;
        // 심전도 파형 스타일로 변경 (R파, P파, T파 등)
        newData[lastIndex - 3] = 50 - audioLevel / 8; // P파
        newData[lastIndex - 2] = 50 + audioLevel / 8; // Q파
        newData[lastIndex - 1] = 50 - audioLevel / 1.5; // R파 (큰 피크)
        newData[lastIndex] = 50 + audioLevel / 4; // S파
      }

      return newData;
    });

    animationFrameRef.current = requestAnimationFrame(updateVitalData);
  }, [audioLevel, isMicOn]);

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
        console.log('Requesting microphone...');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        console.log('Microphone granted:', stream);

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
      console.log('Requesting media devices...');
      // 카메라와 마이크 동시에 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: true,
      });
      console.log('Media devices granted:', stream);

      // 카메라 설정
      if (videoRef.current) {
        console.log('Setting video source...');
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
          console.log('Video playback started');
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
      console.log('Video element mounted, setting up stream...');
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
    console.log('WaitingRoomContent mounted');
    console.log('Current roomCode:', contextRoomCode);

    const fetchRoomData = async () => {
      if (contextRoomCode) {
        try {
          const roomData = await getRoomData(contextRoomCode);
          console.log('Room data fetched:', roomData);
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

    console.log('연결 시도:', contextRoomCode);
    // 웹소켓 연결
    connect(contextRoomCode);

    // 연결이 성공하면 메시지 전송
    if (isConnected) {
      // 서버에 입장 메시지 전송
      contextSend('입장했습니다.', 'System');
      console.log('메시지 전송 완료');

      // 채팅 메시지 구독
      if (stompClient) {
        stompClient.subscribe(`/topic/room.${contextRoomCode}`, (frame) => {
          const message = JSON.parse(frame.body);
          setChatMessages((prev) => [...prev, message]);
        });
      }
    }
  }, [contextRoomCode, connect, contextSend, isConnected, stompClient]);

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
        console.log('Requesting camera...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
        });
        console.log('Camera granted:', stream);

        mediaStreamRef.current = stream;
        setIsCameraOn(true);

        if (videoRef.current) {
          console.log('Setting video source...');
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
            console.log('Video playback started');
          } catch (error) {
            console.error('Failed to start video playback:', error);
          }
        }
      } catch (error) {
        console.error('Camera access failed:', error);
      }
    }
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden p-20 py-10">
      {/* Left section */}
      <div className="flex-1 flex-col px-10">
        {/* Header */}
        <div className="flex items-center mb-6">
          <div className="text-white headline-large">게임방 제목</div>
          <div className="text-white body-medium ml-3">
            Code : 1234 587 8912
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
          <div className="text-primary-600 headline-large ml-4">5/6</div>
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
                    김싸피
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
              참여자 ({['도비', '라이어고수', '프신', '진짜시민'].length}/5)
            </div>
            {['도비', '라이어고수', '프신', '진짜시민'].map((name) => (
              <div
                key={name}
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
                  {name}
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

          <div className="bg-gray-200 rounded-xl p-6">
            <div className="grid grid-cols-4 gap-x-12 gap-y-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`text-center text-xl font-['FUNFLOW_SURVIVOR_KR'] ${
                    category.highlight
                      ? 'text-rose-600 font-bold [text-shadow:_2px_2px_4px_rgba(0,0,0,0.25)]'
                      : 'text-white'
                  }`}
                >
                  {category.label}
                </div>
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
                  className={`font-bold ${msg.sender === 'System' ? 'text-gray-300' : 'text-green-500'}`}
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
          <div className="mt-4 text-center text-sm text-gray-400">
            채팅을 입력하세요.
          </div>
        </div>

        {/* Exit / Start button */}
        <div className="flex justify-end mt-4">
          <GameButton text="시작" />
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
