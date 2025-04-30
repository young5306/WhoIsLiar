import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  FormEvent,
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
import axios from 'axios';
import gameRoom from './GameRoom.module.css';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import UserVideoComponent from './UserVideoComponent';
import { useWebSocketContext } from '../../contexts/WebSocketProvider';
import { GameButton } from '../../components/common/GameButton';

const APPLICATION_SERVER_URL = import.meta.env.PROD
  ? import.meta.env.VITE_OVD_SERVER_URL
  : import.meta.env.VITE_APP_LOCAL_SERVER_URL;

interface Subscriber extends StreamManager {
  id: string;
}

const GameVid: React.FC = () => {
  const [myUserName, setMyUserName] = useState<string>('');

  // ck) 세션 ID는 세션을 식별하는 문자열, 입장 코드?와 비슷한 역할을 하는듯 (중복되면 안되고, 같은 세션 이이디 입력한 사람은 같은 방에 접속되며, 만약 세션 아이디가 존재하지 않는다면 새로 생성해서 세션을 오픈할 수 있게끔 한다.) -> 어떻게 생성하고 바꿀지 고민 필요
  const [mySessionId, setMySessionId] = useState('SessionA');

  // ck) 현재 연결된 세션
  const [session, setSession] = useState<Session | undefined>(undefined);

  // ck) 메인으로 표시될 비디오 스트림 (다른 메인도 표시해줄지 아니면 본인것을 메인으로 간주할지?)
  const [mainStreamManager, setMainStreamManager] = useState<
    StreamManager | undefined
  >(undefined);

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

  const OV = useRef<OpenVidu | null>(null);

  const { userInfo } = useAuthStore();
  useEffect(() => {
    if (userInfo?.nickname) {
      setMyUserName(userInfo.nickname);
    } else {
      setMyUserName(`Participant${Math.floor(Math.random() * 100)}`);
    }
  }, [userInfo]);

  // ck) 메인 비디오 스트림 변경
  const handleMainVideoStream = (stream: StreamManager) => {
    if (mainStreamManager !== stream) {
      setMainStreamManager(stream);
    }
  };

  // ck) 구독자 삭제
  const deleteSubscriber = (streamManager: StreamManager) => {
    setSubscribers((prev) => prev.filter((sub) => sub !== streamManager));
  };

  // ck) 세션 참가
  const joinSession = async () => {
    // if (e) e.preventDefault();
    // ck) add - 사용자 닉네임? 기준으로 이미 세션에 참가중이면 새로운 세션 참가 막기

    OV.current = new OpenVidu();
    const mySession = OV.current.initSession();

    mySession.on('streamCreated', (event: StreamEvent) => {
      const subscriber = mySession.subscribe(event.stream, undefined);
      setSubscribers((prev) => [...prev, subscriber]);
    });

    mySession.on('streamDestroyed', (event: StreamEvent) => {
      deleteSubscriber(event.stream.streamManager);
    });

    mySession.on('exception', (exception: ExceptionEvent) => {
      console.warn(exception);
    });

    try {
      // ck) getToken 분리
      const token = await getToken(mySessionId);
      await mySession.connect(token, { clientData: myUserName });

      const publisherObj = await OV.current.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: undefined,
        publishAudio: true,
        publishVideo: true,
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
      setMainStreamManager(publisherObj);
      setPublisher(publisherObj);
      setCurrentVideoDevice(currentVideoDevice);
      setCurrentMicDevice(currentMicDevice);
    } catch (error) {
      console.error('There was an error connecting to the session:', error);
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
    setMySessionId('SessionA');
    // ck) 사용자 이름 초기화 수정
    setMyUserName('Participant' + Math.floor(Math.random() * 100));

    setMainStreamManager(undefined);
    setPublisher(undefined);

    // ck) 카메라, 마이크 연결 끊기
    setCurrentVideoDevice(null);
    setCurrentMicDevice(null);
  }, [session]);

  // ck) 사용자 세션 닫힐 때, 세션 정리(cleanup)
  useEffect(() => {
    // // 기존
    // const handleBeforeUnload = () => {
    //     leaveSession();
    //   };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      leaveSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [leaveSession]);

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

        await session.unpublish(mainStreamManager as Publisher);
        await session.publish(newPublisher);
        setCurrentVideoDevice(newVideoDevice);
        setMainStreamManager(newPublisher);
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

        await session.unpublish(mainStreamManager as Publisher);
        await session.publish(newPublisher);
        setCurrentMicDevice(newMicDevice);
        setMainStreamManager(newPublisher);
        setPublisher(newPublisher);
      }
    }
  };

  // ck) 서버 통신
  const getToken = async (sessionId: string): Promise<string> => {
    const createSessionId = await createSession(sessionId);
    return await createToken(createSessionId);
  };

  const createSession = async (sessionId: string): Promise<string> => {
    // ck) 실제 세션 발급받는 api로 변경
    const response = await axios.post(
      APPLICATION_SERVER_URL + 'api/sessions',
      { customSessionId: sessionId },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('createSession res: ', response);
    return response.data;
  };

  const createToken = async (sessionId: string): Promise<string> => {
    const response = await axios.post(
      APPLICATION_SERVER_URL + 'api/sessions/' + sessionId + '/connections',
      {},
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('createToken res: ', response);
    return response.data;
  };

  return (
    <>
      {/* <div>GameVid</div> */}
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

      <div className="container">
        {/* 세션이 없을 때: 참가 폼 */}
        {session === undefined ? (
          <div id="join">
            <div id="join-dialog" className="jumbotron vertical-center">
              <div className="mb-2">
                <h1>Join a video session</h1>
                <div>
                  <label>Participant: </label>
                  {myUserName}
                </div>
                <div>
                  <label>Session: </label>
                  {mySessionId}
                </div>
              </div>
              <GameButton text="시작하기" size="small" onClick={joinSession} />
            </div>
          </div>
        ) : null}

        {/* 세션이 있을 때: 비디오 및 컨트롤 */}
        {session !== undefined ? (
          <div id="session">
            <div id="session-header">
              <h1 id="session-title">{mySessionId}</h1>
              <input
                className="btn btn-large btn-danger"
                type="button"
                id="buttonLeaveSession"
                onClick={leaveSession}
                value="Leave session"
              />
              <input
                className="btn btn-large btn-success"
                type="button"
                id="buttonSwitchCamera"
                onClick={switchCamera}
                value="Switch Camera"
              />
            </div>
            {mainStreamManager !== undefined ? (
              <div id="main-video" className="col-md-6">
                <UserVideoComponent streamManager={mainStreamManager} />
              </div>
            ) : null}
            <div id="video-container" className="col-md-6">
              {publisher !== undefined ? (
                <div
                  className="stream-container col-md-6 col-xs-6"
                  onClick={() => handleMainVideoStream(publisher)}
                >
                  <UserVideoComponent streamManager={publisher} />
                </div>
              ) : null}
              {subscribers.map((sub, i) => (
                <div
                  key={sub.id || i}
                  className="stream-container col-md-6 col-xs-6"
                  onClick={() => handleMainVideoStream(sub)}
                >
                  <span>{sub.id}</span>
                  <UserVideoComponent streamManager={sub} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default GameVid;
