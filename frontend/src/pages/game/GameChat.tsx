import { useEffect, useRef, useState } from 'react';
import { useWebSocketContext } from '../../contexts/WebSocketProvider';
import { useAuthStore } from '../../stores/useAuthStore';
import { notify } from '../../components/common/Toast';
import useSocketStore from '../../stores/useSocketStore';

const GameChat = () => {
  const [chatInput, setChatInput] = useState<string>('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const { userInfo } = useAuthStore();
  const { send: contextSend, isConnected } = useWebSocketContext();
  const { chatMessages } = useSocketStore();

  // 새 메시지가 올 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // 채팅 메시지 길이 제한 (100자)
    if (chatInput.length > 100) {
      notify({
        type: 'warning',
        text: '채팅 메시지는 100자를 초과할 수 없습니다.',
      });
      return;
    }

    // 특수문자 제한 (이모지, HTML 태그 등)
    const sanitizedInput = chatInput.replace(/[<>]/g, '');
    if (sanitizedInput !== chatInput) {
      notify({
        type: 'warning',
        text: '특수문자 <, >는 사용할 수 없습니다.',
      });
      return;
    }

    // 웹소켓 연결 상태 확인
    if (!isConnected) {
      console.warn('WebSocket이 연결되지 않았습니다.');
      return;
    }

    // 웹소켓으로 메시지 전송
    contextSend(sanitizedInput, userInfo?.nickname || 'Unknown', 'NORMAL');
    setChatInput('');

    // 메시지 전송 후 스크롤을 맨 아래로 이동
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-[calc(100vh-5rem)] flex flex-col flex-shrink-0 z-50">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 flex flex-col h-full">
        <div className="text-white text-sm mb-2 border-b border-gray-700 pb-1">
          채팅
        </div>
        <div
          className="relative flex-1"
          style={{ height: 'calc(100% - 80px)' }}
        >
          <div
            ref={chatContainerRef}
            className="absolute inset-0 space-y-1 overflow-y-auto pr-1 custom-scrollbar"
          >
            {chatMessages.map((msg, index) => (
              <div key={index} className="flex flex-col">
                <span
                  className={`font-bold body-medium ${
                    msg.sender === 'System'
                      ? 'text-primary-500'
                      : msg.sender === userInfo?.nickname
                        ? 'text-green-500'
                        : 'text-white'
                  }`}
                >
                  {msg.sender}
                </span>
                <span
                  className={`text-xs break-words ${
                    msg.sender === 'System'
                      ? 'text-rose-500'
                      : msg.sender === userInfo?.nickname
                        ? 'text-green-500'
                        : 'text-white'
                  }`}
                >
                  {msg.content}
                </span>
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={handleSendMessage} className="mt-2">
          <div className="flex gap-1">
            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={(e) => {
                // 입력값 길이 제한
                if (e.target.value.length <= 100) {
                  setChatInput(e.target.value);
                }
              }}
              placeholder="채팅을 입력하세요. (최대 100자)"
              className="flex-1 h-10 bg-gray-700/50 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-rose-500"
              maxLength={100}
            />
            <button
              type="submit"
              className="bg-primary-500 hover:bg-primary-600 text-white text-xs px-2 py-1 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              전송
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameChat;
