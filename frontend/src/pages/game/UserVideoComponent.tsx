import React from 'react';
import { StreamManager } from 'openvidu-browser';
import OpenViduVideoComponent from './OvVideo';

interface UserVideoComponentProps {
  streamManager: StreamManager;
}

const UserVideoComponent: React.FC<UserVideoComponentProps> = ({
  streamManager,
}) => {
  // 사용자 닉네임 추출
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
