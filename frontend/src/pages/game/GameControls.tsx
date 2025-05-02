import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  // SwitchCamera,
  Settings,
  PhoneOff,
} from 'lucide-react';

interface GameControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  onLeaveSession: () => void;
}

const GameControls = ({
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  // onSwitchCamera,
  onLeaveSession,
}: GameControlsProps) => {
  const handleSettings = () => {
    console.log('Settings');
  };
  return (
    <>
      {/* <div></div> */}
      {/* <div className="flex justify-between items-center w-full p-3 bg-gray-900 rounded-lg"> */}
      <div className="flex justify-end items-center w-full p-3 rounded-lg gap-4">
        <div>
          <div className="flex space-x-4">
            <button
              onClick={onToggleAudio}
              className={`p-2 rounded-full ${isAudioEnabled ? 'bg-transparent border border-gray-600' : 'bg-red-600 border border-red-600'}`}
            >
              {isAudioEnabled ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={onToggleVideo}
              className={`p-2 rounded-full ${isVideoEnabled ? 'bg-transparent border border-gray-600' : 'bg-red-600 border border-red-600'}`}
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
          <button
            onClick={handleSettings}
            className="p-2 rounded-full bg-transparent border border-gray-600"
          >
            <Settings className="h-5 w-5" />
          </button>

          <button
            className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6 py-2 flex items-center"
            onClick={onLeaveSession}
          >
            <PhoneOff className="h-5 w-5 mr-2" /> 방 나가기
          </button>
        </div>
      </div>
    </>
  );
};

export default GameControls;
