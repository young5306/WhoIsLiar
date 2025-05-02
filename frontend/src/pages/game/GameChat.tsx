import React, { useState } from 'react';
import GameButton from '../../components/common/GameButton';

const GameChat: React.FC = () => {
  const [chatMessages, _setChatMessages] = useState<
    Array<{ sender: string; content: string }>
  >([]);

  return (
    <>
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
      </div>
    </>
  );
};

export default GameChat;
