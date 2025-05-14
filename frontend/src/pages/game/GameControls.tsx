import { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  // SwitchCamera,
  // Settings,
  // PhoneOff,
} from 'lucide-react';
import GameButton from '../../components/common/GameButton';
import ConfirmModal from '../../components/modals/ConfirmModal';

interface GameControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  myUserName: string;
  speakingPlayer: string;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onLeaveSession: () => void;
}

const GameControls = ({
  isAudioEnabled,
  isVideoEnabled,
  myUserName,
  speakingPlayer,
  onToggleAudio,
  onToggleVideo,
  onLeaveSession,
}: GameControlsProps) => {
  // const handleSettings = () => {
  // console.log('Settings');
  // };

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  return (
    <>
      {/* <div></div> */}
      {/* <div className="flex justify-between items-center w-full p-3 bg-gray-900 rounded-lg"> */}
      <div className="flex justify-end items-center w-full p-3 rounded-lg gap-4">
        <div>
          <div className="flex space-x-4">
            <button
              onClick={
                myUserName === speakingPlayer ? onToggleAudio : undefined
              }
              className={`p-2 rounded-full ${myUserName === speakingPlayer && isAudioEnabled ? 'bg-transparent border border-gray-600 hover:opacity-80 hover:bg-gray-800' : 'bg-red-600 border border-red-600 hover:bg-red-700'} ${myUserName === speakingPlayer ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              {myUserName === speakingPlayer && isAudioEnabled ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5 " />
              )}
            </button>

            <button
              onClick={onToggleVideo}
              className={`p-2 rounded-full ${isVideoEnabled ? 'bg-transparent border border-gray-600 hover:opacity-80 hover:bg-gray-800' : 'bg-red-600 border border-red-600 hover:bg-red-700'} cursor-pointer`}
            >
              {isVideoEnabled ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-row gap-4">
          {/* <button
            onClick={handleSettings}
            className="p-2 rounded-full bg-transparent border border-gray-600"
          >
            <Settings className="h-5 w-5" />
          </button> */}

          {/* <button
            className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6 py-2 flex items-center cursor-pointer"
            onClick={onLeaveSession}
          >
            <PhoneOff className="h-5 w-5 mr-2" /> 방 나가기
          </button> */}

          <GameButton
            text="방 나가기"
            variant="default"
            size="small"
            onClick={() => setIsConfirmModalOpen(true)}
          />

          {/* 확인 모달 */}
          <ConfirmModal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={onLeaveSession}
            title="방 나가기"
            message="정말로 방을 나가시겠습니까?"
          />
        </div>
      </div>
    </>
  );
};

export default GameControls;
