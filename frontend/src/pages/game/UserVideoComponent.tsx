import React from 'react';
import { StreamManager } from 'openvidu-browser';
import OpenViduVideoComponent from './OvVideo';

interface UserVideoComponentProps {
  streamManager: StreamManager;
}

const UserVideoComponent: React.FC<UserVideoComponentProps> = ({
  streamManager,
}) => {
  return (
    <div>
      {streamManager !== undefined ? (
        <div
          className="streamcomponent w-full h-full "
          style={{ transform: 'scaleX(-1) scale(1.5) translateY(-15px)' }}
        >
          {/* 비디오 컴포넌트에 streamManager 전달 */}
          <OpenViduVideoComponent streamManager={streamManager} />
        </div>
      ) : null}
    </div>
  );
};

export default UserVideoComponent;
