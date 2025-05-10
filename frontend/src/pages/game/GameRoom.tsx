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
} from '../../services/api/GameService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useRoomStore } from '../../stores/useRoomStore';
import UserVideoComponent from './UserVideoComponent';
import GameInfo from './GameInfo';
import GameControls from './GameControls';

import { FaceApiResult } from '../../services/api/FaceApiService';
import { loadModels } from '../../services/api/FaceApiService';
import GameChat from './GameChat';
import FaceApiEmotion from './FaceApi';
import EmotionLog from './EmotionLog';
import { useWebSocketContext } from '../../contexts/WebSocketProvider';
import useSocketStore from '../../stores/useSocketStore';

const GameRoom = () => {
  const { emotionLogs: socketEmotionLogs } = useSocketStore();

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
  const [mySessionId, setMySessionId] = useState('');

  // << OpenVidu >>
  // 현재 연결된 세션
  const [session, setSession] = useState<Session | undefined>(undefined);

  // 본인의 카메라/마이크 스트림
  const [publisher, setPublisher] = useState<Publisher | undefined>(undefined);
  // 같은 세션에 있는 다른 참가자 스트림 목록
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  // 현재 사용 중인 카메라 장치 정보
  const [currentVideoDevice, setCurrentVideoDevice] = useState<Device | null>(
    null
  );

  // 현재 사용 중인 마이크 장치 정보
  const [currentMicDevice, setCurrentMicDevice] = useState<Device | null>(null);

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
  const { clearSubscription, clearEmotionSubscription, clearChatMessages } =
    useSocketStore();

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
      setMySessionId(roomCode);
    } else {
      setMySessionId('');
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

    if (myUserName && mySessionId && session === undefined) {
      joinSession();
    }
  }, [myUserName, mySessionId]);

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
      const token = await getToken(mySessionId);
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
    setMySessionId(roomCode || '');
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
      if (newAudioState) publisher.publishAudio(newAudioState);
      setIsAudioEnabled(newAudioState);
    }
  };

  const toggleVideo = () => {
    if (publisher) {
      const newVideoState = !isVideoEnabled;
      publisher.publishVideo(newVideoState);
      publisher.videos;
      setIsVideoEnabled(newVideoState);
    }
  };

  const switchCamera = async () => {
    if (
      !OV.current ||
      !publisher ||
      !session ||
      !currentVideoDevice ||
      !currentMicDevice
    )
      return;

    const devices = await OV.current.getDevices();
    const videoDevices = devices.filter(
      (device) => device.kind === 'videoinput'
    );
    const micDevices = devices.filter((device) => device.kind === 'audioinput');

    if (videoDevices.length > 1) {
      const newVideoDevice = videoDevices.find(
        (device) => device.deviceId !== currentVideoDevice.deviceId
      );
      if (publisher && newVideoDevice) {
        const prevPublishAudio = publisher.publishAudio;

        const newPublisher = OV.current.initPublisher(undefined, {
          videoSource: newVideoDevice.deviceId,
          publishAudio: prevPublishAudio ?? true,
          publishVideo: true,
          mirror: false,
        } as any);

        await session.unpublish(publisher as Publisher);
        await session.publish(newPublisher);
        setCurrentVideoDevice(newVideoDevice);
        setPublisher(newPublisher);
      }
    }
    if (micDevices.length > 1) {
      const newMicDevice = micDevices.find(
        (device) => device.deviceId !== currentMicDevice.deviceId
      );
      if (publisher && newMicDevice) {
        const prevPublishVideo = publisher.publishVideo;

        const newPublisher = OV.current.initPublisher(undefined, {
          MicSource: newMicDevice.deviceId,
          publishVideo: prevPublishVideo ?? true,
          publishAudio: true,
          mirror: false,
        } as any);

        await session.unpublish(publisher as Publisher);
        await session.publish(newPublisher);
        setCurrentMicDevice(newMicDevice);
        setPublisher(newPublisher);
      }
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

  return (
    <>
      {session !== undefined ? (
        <>
          <div className="w-full h-full flex flex-col px-8">
            <div className="text-white w-full h-full grid grid-cols-7">
              <GameInfo
                round={gameState.round}
                turn={gameState.turn}
                category={gameState.category}
                topic={gameState.topic}
                isLiar={playerState.isLiar}
              />

              {/* Video 영역 */}
              {subscribers.map((sub, index) => (
                <div
                  key={sub.id || index}
                  className={`relative ${getParticipantPosition(index + 1, subscribers.length + 1)}`}
                >
                  <div className="w-full h-fit bg-gray-700 flex items-center justify-center overflow-hidden rounded-lg shadow-2xl">
                    <div className="w-full h-full relative">
                      <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                        {sub.nickname}
                      </div>
                      <div className="w-full h-full flex items-center justify-center">
                        <UserVideoComponent streamManager={sub} />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-1 mb-2 left-1 z-20 gap-4 flex flex-row">
                    {/* <FaceApiEmotion
                      streamManager={sub}
                      name={sub.nickname}
                      onEmotionUpdate={(emotionResult) =>
                        updateEmotionLog(sub.nickname!, emotionResult)
                      }
                      isLogReady={false}
                      setIsLogReady={setIsLogReady}
                    /> */}
                    <EmotionLog
                      name={sub.nickname!}
                      emotion={emotionLogs[sub.nickname!] || undefined}
                      isLogReady={isLogReady}
                    />
                  </div>
                </div>
              ))}

              {/* my video */}
              <div className={`relative ${myPosition}`}>
                <div className="w-full min-h-[150px] max-h-[170px] bg-pink-300 flex items-center justify-center overflow-hidden rounded-lg">
                  <div className="w-full min-h-[150px] max-h-[170px] relative">
                    <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                      나
                    </div>
                    <div className="w-full min-h-[150px] max-h-[170px] flex items-center justify-center">
                      {publisher && isVideoEnabled ? (
                        <UserVideoComponent streamManager={publisher} />
                      ) : (
                        <div className="text-5xl font-bold w-full max-h-[170px] min-h-[150px] flex justify-center items-center">
                          Me
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-1 mb-2 left-1 z-20">
                  {publisher && (
                    <div className="flex flex-row gap-4">
                      <FaceApiEmotion
                        streamManager={publisher}
                        name={myUserName}
                        // userIndex={order}
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
                onSwitchCamera={switchCamera}
                onLeaveSession={leaveSession}
              />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};

export default GameRoom;
