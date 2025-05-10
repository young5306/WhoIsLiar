import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from '../../services/api/GameService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useRoomStore } from '../../stores/useRoomStore';
import UserVideoComponent from './UserVideoComponent';
// import GameButton from '../../components/common/GameButton';
import GameInfo from './GameInfo';
import GameControls from './GameControls';

import { FaceApiResult } from '../../services/api/FaceApiService';
import { loadModels } from '../../services/api/FaceApiService';
import EmotionLog from './FaceApi';
import GameChat from './GameChat';
import { useWebSocketContext } from '../../contexts/WebSocketProvider';
import useSocketStore from '../../stores/useSocketStore';
import { getRoomData } from '../../services/api/RoomService';
import Timer, { TimerRef } from '../../components/common/Timer';
import GameButton from '../../components/common/GameButton';
// import { VideoOff } from 'lucide-react';

const GameRoom = () => {
  const [_emotionLogs, setEmotionLogs] = useState<
    Record<string, FaceApiResult>
  >({});
  // console.log('emotionlog상위', emotionLogs);

  const updateEmotionLog = (
    name: string | undefined,
    emotion: FaceApiResult
  ) => {
    if (name) {
      setEmotionLogs((prevLogs) => ({
        ...prevLogs,
        [name]: emotion,
      }));
    }
  };

  const navigation = useNavigate();
  const [myUserName, setMyUserName] = useState<string>('');
  const [_myToken, setMyToken] = useState<string>('');

  // ck) 세션 ID는 세션을 식별하는 문자열, 입장 코드?와 비슷한 역할을 하는듯 (중복되면 안되고, 같은 세션 이이디 입력한 사람은 같은 방에 접속되며, 만약 세션 아이디가 존재하지 않는다면 새로 생성해서 세션을 오픈할 수 있게끔 한다.) -> 어떻게 생성하고 바꿀지 고민 필요
  // const [mySessionId, setMySessionId] = useState('SessionA');
  // const [mySessionId, setMySessionId] = useState(
  //   `asdsad${Math.floor(Math.random() * 100)}`
  // );
  const [mySessionId, setMySessionId] = useState('');

  // ck) << OpenVidu >>
  // ck) 현재 연결된 세션
  const [session, setSession] = useState<Session | undefined>(undefined);

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
  const { roomCode } = useRoomStore();
  const setRoomCode = useRoomStore((state) => state.setRoomCode);

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
      // console.log('roomCode', roomCode);
    } else {
      setMySessionId('1111');
      // alert('게임방에 입장해주세요');
      // navigation('/room-list');
    }
  }, []);

  useEffect(() => {
    loadModels('/models')
      .then(() => console.log('✅ face-api models loaded'))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (myUserName && mySessionId && session === undefined) {
      joinSession();
    }
  }, [myUserName, mySessionId]);

  // // ck) 세션ID 입력값 변경
  // const handleChangeSessionId = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setMySessionId(e.target.value);
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
    setMySessionId(roomCode || '');
    // ck) 사용자 이름 초기화 수정
    setMyUserName(
      userInfo?.nickname || 'Participant' + Math.floor(Math.random() * 100)
    );

    // setMainStreamManager(undefined);
    setPublisher(undefined);

    // ck) 카메라, 마이크 연결 끊기
    setCurrentVideoDevice(null);
    setCurrentMicDevice(null);

    setRoomCode('');
    outGameRoom();
    console.log('종료된건가?');
    navigation('/room-list');
  }, [session, userInfo]);

  // ck) 새로고침 시, 세션 연결만 종료
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
      publisher.publishAudio(newAudioState);
      setIsAudioEnabled(newAudioState);
    }
  };

  const toggleVideo = () => {
    if (publisher) {
      const newVideoState = !isVideoEnabled;
      publisher.publishVideo(newVideoState);
      setIsVideoEnabled(newVideoState);
      // setCurrentVideoDevice(null);
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
      1: 'col-span-2 col-start-1 row-span-2 row-start-2 max-h-[170px] min-h-[150px] min-w-[180px] max-w-[200px] ml-[18px] mt-[15px]',
      2: 'col-span-2 col-start-6 row-span-2 row-start-2 max-h-[170px] min-h-[150px] min-w-[180px] max-w-[200px] mt-[15px]',
      3: 'col-span-2 col-start-1 row-span-2 row-start-6 max-h-[170px] min-h-[150px] min-w-[180px] max-w-[200px] ml-[18px]',
      4: 'col-span-2 col-start-1 row-span-2 row-start-4 max-h-[170px] min-h-[150px] min-w-[180px] max-w-[200px] ml-[18px]',
      5: 'col-span-2 col-start-6 row-span-2 row-start-4 max-h-[170px] min-h-[150px] min-w-[180px] max-w-[200px]',
      // 6: 'col-span-1 col-start-3 row-span-2 row-start-5 aspect-video w-full max-w-[300px] min-w-[150px]',
    };
    return positions[index as keyof typeof positions] || '';
  };

  // const myPosition =
  //   'col-span-1 col-start-3 row-span-1 row-start-4 min-h-[150px]';
  const myPosition =
    'col-span-2 col-start-6 row-span-2 row-start-6 max-h-[170px] min-h-[150px] min-w-[180px] max-w-[200px]';

  /////////////////////게임 진행 코드 시작/////////////////////
  const { clearChatMessages, subscription, addChatMessage } = useSocketStore();
  const chatMessages = useSocketStore((state) => state.chatMessages); // 메세지 변경만 감지

  // 게임 초기화용 상태
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [totalRoundNumber, setTotalRoundNumber] = useState<number>(3);
  const [participants, setParticipants] = useState<
    Array<{ participantNickname: string; order: number }>
  >([]);
  const [category, setCategory] = useState<string>('');
  const [myWord, setMyWord] = useState<string>('');
  const [hostNickname, setHostNickname] = useState<string>('');

  const [speakingPlayer, setSpeakingPlayer] = useState<string>('');
  const timerRef = useRef<TimerRef>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [selectedTargetNickname, setSelectedTargetNickname] = useState<
    string | null
  >(null);
  const selectedTargetRef = useRef<string | null>(null);

  // 방정보(방장, 카테고리), 라운드 세팅 개인정보 조회
  useEffect(() => {
    const setupGameInfo = async () => {
      if (!roomCode || !myUserName) return;
      try {
        const [playerInfoRes, roomInfoRes] = await Promise.all([
          getPlayerInfo(roomCode),
          getRoomData(roomCode),
        ]);
        setRoundNumber(playerInfoRes.data.roundNumber);
        setTotalRoundNumber(playerInfoRes.data.totalRoundNumber);
        setParticipants(playerInfoRes.data.participants);
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
          await startRound(roomCode, playerInfoRes.data.roundNumber);
          console.log('✅startRound 호출');
          await startTurn(roomCode, playerInfoRes.data.roundNumber);
          console.log('✅startTurn 호출');
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
        // timerRef.current?.startTimer(20);
      }
    }

    // 모든 발언 종료 후 투표 시작
    if (latest.chatType == 'ROUND_END') {
      console.log('💡투표 시작');
      setSpeakingPlayer('');
      setIsVoting(true);
      setSelectedTargetNickname(null);
      // timerRef.current?.startTimer(10); // 10초 안에 투표
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
      timerRef.current?.startTimer(20); // 발언자 바뀌면 타이머 재시작
    }
  }, [speakingPlayer]);

  useEffect(() => {
    if (isVoting) {
      setTimeout(() => {
        timerRef.current?.startTimer(10);
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
    try {
      const target = selectedTargetRef.current;
      await submitVotes(roomCode!, roundNumber, target);
      console.log('투표 완료:', target);
      setIsVoting(false);
    } catch (err) {
      console.error('투표 제출 실패:', err);
    }
  };

  /////////////////////게임 진행 코드 끝/////////////////////

  return (
    <>
      {/* {session === undefined ? (
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
                <label>Session: </label> */}
      {/* {mySessionId} */}
      {/* <input
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
      ) : null} */}

      {session !== undefined ? (
        <>
          <div className="w-full h-full flex flex-col px-8">
            <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
              {/* --- 발언시간 --- */}
              {/* 발언자만 skip 버튼 표시 */}
              {myUserName === speakingPlayer && (
                <GameButton
                  text="Skip"
                  size="small"
                  variant="neon"
                  onClick={() => handleSkipTurn(roomCode)}
                />
              )}
              {/* 타이머는 모두에게 표시 */}
              {speakingPlayer && (
                <Timer
                  ref={timerRef}
                  onTimeEnd={() => console.log('⏰ 타이머 종료')}
                  size="medium"
                />
              )}
              {/* --- 투표 시간 --- */}
              {isVoting && (
                <div className="absolute top-6 right-6 z-50 flex gap-2 items-center">
                  <GameButton
                    text="기권"
                    size="small"
                    variant="gray"
                    onClick={handleVoteSkip}
                  />
                  <Timer
                    ref={timerRef}
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
                        className="absolute top-1/2 left-1/2 w-20 h-20 z-30 -translate-x-1/2 -translate-y-1/2"
                      />
                    )}
                    <div className="w-full h-fit bg-gray-700 flex items-center justify-center overflow-hidden rounded-lg shadow-2xl">
                      <div className="w-full h-full relative">
                        <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                          {sub.nickname}
                        </div>
                        <div className="w-full h-full flex items-center justify-center">
                          <UserVideoComponent streamManager={sub} />

                          {/* {sub.isVideoEnabled ? (
                        <UserVideoComponent streamManager={sub} />
                        ) : (
                          <VideoOff />
                        )} */}
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-1 mb-2 left-1 z-20">
                      <EmotionLog
                        streamManager={sub}
                        name={sub.nickname}
                        onEmotionUpdate={(emotionResult) =>
                          updateEmotionLog(sub.nickname, emotionResult)
                        }
                      />
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
                    <EmotionLog
                      streamManager={publisher}
                      name="나"
                      onEmotionUpdate={(emotionResult) =>
                        updateEmotionLog('나', emotionResult)
                      }
                    />
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

      {/* 투표 진행 화면 */}
      <div
        id="vote-overlay" // 마우스 위치 조정을 위한 ID
        className="fixed inset-0 z-50 pointer-events-none transition-opacity duration-500" // 화면 전체 덮는 레이어
        style={{
          opacity: isVoting ? 1 : 0,
          background:
            'radial-gradient(circle at var(--x, 50vw) var(--y, 50vh), transparent 80px, rgba(0,0,0,0.8) 10px)', // 마우스 위치에 원형 밝은 영역 (마우스 주변 80px까지 밝고, 10px까지 fade)
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

export default GameRoom;
