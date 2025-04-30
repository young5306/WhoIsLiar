import React from 'react';
import { StreamManager } from 'openvidu-browser';
import OpenViduVideoComponent from './OvVideo';
// import './UserVideo.css';

// props 타입 정의
interface UserVideoComponentProps {
  streamManager: StreamManager;
}

/**
 * UserVideoComponent
 * - 스트림 매니저를 받아 비디오와 닉네임을 표시하는 컴포넌트
 */
const UserVideoComponent: React.FC<UserVideoComponentProps> = ({
  streamManager,
}) => {
  // 사용자 닉네임 추출 함수
  const getNicknameTag = () => {
    // OpenVidu의 connection.data에서 clientData(닉네임) 추출
    try {
      return JSON.parse(streamManager.stream.connection.data).clientData;
    } catch {
      return '';
    }
  };

  return (
    <div>
      {streamManager !== undefined ? (
        <div className="streamcomponent">
          {/* 비디오 컴포넌트에 streamManager 전달 */}
          <OpenViduVideoComponent streamManager={streamManager} />
          <div>
            <p>{getNicknameTag()}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UserVideoComponent;
