import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  // FormEvent,
} from 'react';
import {
  OpenVidu,
  Publisher,
  Session,
  StreamManager,
  Device,
  StreamEvent,
  ExceptionEvent,
} from 'openvidu-browser';
// import gameRoom from './GameRoom.module.css';
// import { data, useNavigate } from 'react-router-dom';
import {
  getToken,
  Subscriber,
  GameState,
  PlayerState,
  // Message,
} from '../../services/api/GameService';
import { useAuthStore } from '../../stores/useAuthStore';
import UserVideoComponent from './UserVideoComponent';
// import { useWebSocketContext } from '../../contexts/WebSocketProvider';
import GameButton from '../../components/common/GameButton';
import GameInfo from './GameInfo';
import GameControls from './GameControls';
import GameChat from './GameChat';

const GameRoom: React.FC = () => {
  const [myUserName, setMyUserName] = useState<string>('');
  const [myToken, setMyToken] = useState<string>('');

  // ck) 세션 ID는 세션을 식별하는 문자열, 입장 코드?와 비슷한 역할을 하는듯 (중복되면 안되고, 같은 세션 이이디 입력한 사람은 같은 방에 접속되며, 만약 세션 아이디가 존재하지 않는다면 새로 생성해서 세션을 오픈할 수 있게끔 한다.) -> 어떻게 생성하고 바꿀지 고민 필요
  // const [mySessionId, setMySessionId] = useState('SessionA');
  const [mySessionId, setMySessionId] = useState(
    `asdsad${Math.floor(Math.random() * 100)}`
  );

  // ck) << OpenVidu >>
  // ck) 현재 연결된 세션
  const [session, setSession] = useState<Session | undefined>(undefined);

  // // // ck) 메인으로 표시될 비디오 스트림 (다른 메인도 표시해줄지 아니면 본인것을 메인으로 간주할지?)
  // const [mainStreamManager, setMainStreamManager] = useState<
  //   StreamManager | undefined
  // >(undefined);

  // ck) 본인의 카메라/마이크 스트림
  const [publisher, setPublisher] = useState<Publisher | undefined>(undefined);
  // ck) 같은 세션에 있는 다른 참가자 스트림 목록
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  // ck) 현재 사용 중인 카메라 장치 정보
  const [currentVideoDevice, setCurrentVideoDevice] = useState<Device | null>(
    null
  );

  // ck) 현재 사용 중인 마이크 장치 정보
  const [currentMicDevice, setCurrentMicDevice] = useState<Device | null>(null);

  // ck) 카메라, 마이크 상태 관리
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
  useEffect(() => {
    if (userInfo?.nickname) {
      setMyUserName(userInfo.nickname);
    } else {
      setMyUserName(`Participant${Math.floor(Math.random() * 100)}`);
    }

    if (userInfo?.token) {
      setMyToken(userInfo.token);
    }
  }, [userInfo]);

  // ck) 세션ID 입력값 변경
  const handleChangeSessionId = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMySessionId(e.target.value);
  };

  // // // ck) 메인 비디오 스트림 변경
  // const handleMainVideoStream = (stream: StreamManager) => {
  //   if (mainStreamManager !== stream) {
  //     setMainStreamManager(stream);
  //   }
  // };

  // ck) 구독자 삭제
  const deleteSubscriber = (streamManager: StreamManager) => {
    setSubscribers((prev) => prev.filter((sub) => sub !== streamManager));
  };

  // ck) 세션 참가
  const joinSession = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // ck) add - 사용자 닉네임? 기준으로 이미 세션에 참가중이면 새로운 세션 참가 막기

    OV.current = new OpenVidu();
    const mySession = OV.current.initSession();

    mySession.on('streamCreated', (event: StreamEvent) => {
      // ck) 사용자 정보 추출
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
      // ck) add - 구독자 수 줄어들면 position 위치도 변하게
    });

    mySession.on('exception', (exception: ExceptionEvent) => {
      console.warn('OpenVidu 예외 발생:', exception);
    });

    try {
      // ck) getToken 분리
      const token = await getToken(myUserName, mySessionId, myToken);
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
      // setMainStreamManager(publisherObj);
      setPublisher(publisherObj);
      setCurrentVideoDevice(currentVideoDevice);
      setCurrentMicDevice(currentMicDevice);
      // setGameState((prev) => ({
      //   ...prev,
      //   message: [
      //     ...prev.message,
      //     {
      //       sender: 'system',
      //       content: '',
      //       type: '',
      //     },
      //   ],
      // }));
    } catch (error) {
      console.error('세션 연결 중 오류 발생:', error);
    }
  };

  // ck) 세션 퇴장
  const leaveSession = useCallback(() => {
    if (session) {
      session.disconnect();
    }
    OV.current = null;
    setSession(undefined);
    setSubscribers([]);

    // ck) 세션 ID 초기화 수정
    // setMySessionId(`asdsad${Math.floor(Math.random() * 100)}`);
    setMySessionId(`asdsad7`);
    // ck) 사용자 이름 초기화 수정
    setMyUserName(
      userInfo?.nickname || 'Participant' + Math.floor(Math.random() * 100)
    );

    // setMainStreamManager(undefined);
    setPublisher(undefined);

    // ck) 카메라, 마이크 연결 끊기
    setCurrentVideoDevice(null);
    setCurrentMicDevice(null);
  }, [session, userInfo]);

  // ck) 사용자 세션 닫힐 때, 세션 정리(cleanup)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      leaveSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [leaveSession]);

  const toggleAudio = () => {
    if (publisher) {
      const newAudioState = !isAudioEnabled;
      publisher.publishAudio(newAudioState);
      setIsAudioEnabled(newAudioState);
    }
  };

  const toggleVideo = () => {
    if (publisher) {
      const newVideoState = !isVideoEnabled;
      publisher.publishVideo(newVideoState);
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

        // await session.unpublish(mainStreamManager as Publisher);
        await session.unpublish(publisher as Publisher);
        await session.publish(newPublisher);
        setCurrentVideoDevice(newVideoDevice);
        // setMainStreamManager(newPublisher);
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

        // await session.unpublish(mainStreamManager as Publisher);
        await session.unpublish(publisher as Publisher);
        await session.publish(newPublisher);
        setCurrentMicDevice(newMicDevice);
        // setMainStreamManager(newPublisher);
        setPublisher(newPublisher);
      }
    }
  };

  // option 1) 원형 ---------------------
  // const getParticipantPosition = (
  //   index: number,
  //   _totalParticipants: number
  // ): string => {
  //   const positions = {
  //     1: 'col-span-1 col-start-1 min-w-[150px]',
  //     2: 'col-span-1 col-start-1 row-span-1 row-start-4 min-w-[150px]',
  //     3: 'col-span-1 col-start-7 max-h-[200px] min-h-[120px] min-w-[150px]',
  //     4: 'col-span-1 col-start-7 row-span-1 row-start-4 max-h-[200px] min-h-[120px] min-w-[150px]',
  //     5: 'row-span-1 row-start-1 col-span-1 col-start-4 max-h-[200px] min-h-[150px] min-w-[150px]',
  //     // 6: 'col-span-1 col-start-3 row-span-2 row-start-5 aspect-video w-full max-w-[300px] min-w-[150px]',
  //   };
  //   return positions[index as keyof typeof positions] || '';
  // };

  // const myPosition =
  // 'row-span-1 col-span-1 col-start-4 row-start-4 max-h-[140px] min-w-[150px]';

  // ----------------------------------------

  // option 2) 3:3
  const getParticipantPosition = (
    index: number,
    _totalParticipants: number
  ): string => {
    const positions = {
      1: 'col-span-2 col-start-2 row-span-2 row-start-2 max-h-[200px] min-w-[200px] max-w-[250px] mt-[-60px]',
      2: 'col-span-2 col-start-6 row-span-2 row-start-2 max-h-[200px] min-w-[200px] max-w-[250px] mt-[-60px]',
      3: 'col-span-2 col-start-2 row-span-2 row-start-6 max-h-[200px] min-w-[200px] max-w-[250px]',
      4: 'col-span-2 col-start-1 row-span-2 row-start-4 max-h-[200px] min-w-[200px] max-w-[250px] ml-[20px]',
      5: 'col-span-2 col-start-6 row-span-2 row-start-4 max-h-[200px] min-w-[200px] max-w-[250px] ml-[130px]',
      // 6: 'col-span-1 col-start-3 row-span-2 row-start-5 aspect-video w-full max-w-[300px] min-w-[150px]',
    };
    return positions[index as keyof typeof positions] || '';
  };

  // const myPosition =
  //   'col-span-1 col-start-3 row-span-1 row-start-4 min-h-[150px]';
  const myPosition =
    'col-span-2 col-start-6 row-span-2 row-start-6 max-h-[200px] min-w-[200px] max-w-[250px]';

  return (
    <>
      {/* waitingRoom에서 RoomID를 받아서 그걸 SessionID에 저장 후 be에 보내기 */}
      {/* const [mySessionId, setMySessionId] = useState('SessionA'); */}

      {/* 
      ck) 
      - (상황) : 이미 사람들이 방 정보를 입력하고 대기실에 접속한 상태에서 openvidu연결을 대기하는 것임.
      - 게임시작을 누르자마자 session을 발급 받고 openvidu 입장시키기. 
      - session을 정말 게임ing 화면을 진입하는데 사용해야 할듯
      - 사용자가 session 커스텀 불가(openvidu 기존 코드에서는 커스텀할 수 있었음.). 
      - 공유할 필요도 없음. 
      - (게임 대기실에 입장하는 코드와 별개로 생각해야 할듯)

      => 따라서 session이 없는 상태는 대기실에 있는 상태 / session이 있는 상태는 게임 진행중인 상태
       */}

      {/* <div className="container"> */}
      {/* 세션이 없을 때: 참가 폼 */}
      {session === undefined ? (
        <div id="join">
          <div id="join-dialog" className="jumbotron vertical-center">
            <div className="text-white">GameRoom</div>
            <div className="mb-2 w-100 h-30 bg-amber-200 flex justify-center flex-col">
              <h1 className="text-2xl mb-3 flex justify-center">
                게임 대기방 Waiting Room
              </h1>
              <div className="flex justify-center mb-2">
                <label>Participant: </label>
                {myUserName}
              </div>
              <div className="flex justify-center">
                <label>Session: </label>
                {/* {mySessionId} */}
                <input
                  className="form-control w-30"
                  type="text"
                  id="sessionId"
                  value={mySessionId}
                  onChange={handleChangeSessionId}
                  required
                />
              </div>
            </div>
            <GameButton text="시작하기" size="small" onClick={joinSession} />
          </div>
        </div>
      ) : null}

      {/* 세션이 있을 때: 비디오 및 컨트롤 */}

      {session !== undefined ? (
        <>
          <div className="w-full h-full flex flex-col">
            <div className=" text-white w-full h-full grid grid-cols-7">
              {/* <div className="border-white border-2 text-white w-full h-full grid grid-cols-7"> */}
              {/* <div className="bg-black text-white w-full h-full grid grid-cols-6"> */}
              {/* GameInfo 영역 */}
              <GameInfo
                round={gameState.round}
                turn={gameState.turn}
                category={gameState.category}
                topic={gameState.topic}
                isLiar={playerState.isLiar}
              />

              {/* Video 영역 */}
              {/* <div className="w-screen h-screen grid grid-cols-6 grid-rows-6 gap-4 flex-grow"> */}
              {subscribers.map((sub, index) => (
                <div
                  key={sub.id || index}
                  className={`relative ${getParticipantPosition(index + 1, subscribers.length + 1)}`}
                >
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center overflow-hidden rounded-lg">
                    {/* subs video */}
                    <div className="w-full h-full relative">
                      {/* name */}
                      <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                        {sub.nickname}
                      </div>
                      <div className="w-full h-full flex items-center justify-center">
                        <UserVideoComponent streamManager={sub} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* my video */}
              <div className={`relative ${myPosition}`}>
                {/* <div className="flex justify-center items-center place-items-center relative"> */}
                <div className="w-full h-full bg-pink-300 flex items-center justify-center overflow-hidden rounded-lg">
                  <div className="w-full h-full relative">
                    <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                      나
                    </div>

                    {/* <div className="w-full h-full flex items-center justify-center"> */}
                    <div className="w-full h-full flex items-center justify-center">
                      {publisher !== undefined ? (
                        isVideoEnabled ? (
                          // <div
                          //   className="stream-container col-md-6 col-xs-6"
                          //   onClick={() => handleMainVideoStream(publisher)}
                          // >
                          // </div>

                          <UserVideoComponent streamManager={publisher} />
                        ) : (
                          <div className="text-5xl font-bold">Me</div>
                        )
                      ) : null}
                      {/* <div className="text-5xl font-bold">Me</div> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* <div>
              <GameChat />
            </div> */}
            <div className="mt-2 mb-[-20px] text-white">
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
      {/* </div> */}
      {/* </div> */}
    </>
  );
};

export default GameRoom;
