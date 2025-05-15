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

  // 스크롤 관련 상태 추가
  const [userScrolled, setUserScrolled] = useState(false);
  const [showNewMessageAlert, setShowNewMessageAlert] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  // 이전 메시지 길이를 저장하는 ref (무한 증가 방지용)
  const prevMessageLengthRef = useRef<number>(0);

  // HINT 타입의 메시지를 필터링한 채팅 메시지 목록
  const filteredMessages = chatMessages.filter(
    (msg) => msg.chatType !== 'HINT'
  );

  // 시스템 메시지에서 유저 이름 강조 처리하는 함수
  const highlightUsername = (content: string) => {
    // "xx님이" 패턴을 찾아서 강조 처리
    const usernameRegex = /(\S+)님이/;
    const match = content.match(usernameRegex);

    if (match && match[1]) {
      const username = match[1];
      const parts = content.split(username);

      return (
        <>
          {parts[0]}
          <span className="text-white font-bold">{username}</span>
          {parts[1]}
        </>
      );
    }

    return content;
  };

  // 새 메시지가 올 때마다 스크롤을 맨 아래로 이동 (사용자 스크롤 상태에 따라)
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const currentMsgLength = filteredMessages.length;

      // 실제 새 메시지가 추가됐는지 확인
      const hasNewMessages = currentMsgLength > prevMessageLengthRef.current;

      // 새 메시지 개수 계산
      const newMsgCount = hasNewMessages
        ? currentMsgLength - prevMessageLengthRef.current
        : 0;

      // 이전 메시지 길이 업데이트
      prevMessageLengthRef.current = currentMsgLength;

      // 사용자가 스크롤을 위로 올린 상태인지 확인
      const isScrolledUp =
        container.scrollHeight - container.scrollTop - container.clientHeight >
        30;

      if (!userScrolled || !isScrolledUp) {
        // 사용자가 스크롤을 올리지 않았거나, 이미 맨 아래에 있는 경우 스크롤 다운
        container.scrollTop = container.scrollHeight;
        setUserScrolled(false);
        setShowNewMessageAlert(false);
        setNewMessageCount(0);
      } else if (hasNewMessages) {
        // 사용자가 스크롤을 올린 상태이고 실제로 새 메시지가 있는 경우에만 알림 표시
        setShowNewMessageAlert(true);
        setNewMessageCount((prev) => prev + newMsgCount);
      }
    }
  }, [filteredMessages]);

  // 컴포넌트 마운트 시 초기 메시지 길이 설정
  useEffect(() => {
    prevMessageLengthRef.current = filteredMessages.length;
  }, []);

  // 채팅 컨테이너에 스크롤 이벤트 리스너 추가
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        30;

      if (isAtBottom) {
        // 사용자가 맨 아래로 스크롤했으면 상태 초기화
        setUserScrolled(false);
        setShowNewMessageAlert(false);
        setNewMessageCount(0);
      } else {
        // 사용자가 스크롤을 위로 올린 상태
        setUserScrolled(true);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 새 메시지로 스크롤하는 함수
  const scrollToLatestMessage = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
      setShowNewMessageAlert(false);
      setNewMessageCount(0);
      setUserScrolled(false);
    }
  };

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
        setUserScrolled(false); // 내가 보낸 메시지 후에는 자동 스크롤되도록
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
            {filteredMessages.map((msg, index) => (
              <div key={index} className="flex flex-col">
                {msg.sender === 'SYSTEM' ? (
                  <div className="flex justify-center my-2">
                    <span className="text-purple-400 text-xs font-medium bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full shadow-lg">
                      {highlightUsername(msg.content)}
                    </span>
                  </div>
                ) : (
                  <>
                    <div
                      className={`flex flex-col ${msg.sender === userInfo?.nickname ? 'items-end' : 'items-start'} mb-1`}
                    >
                      <span
                        className={`text-[10px] text-gray-400 mb-0.5 ${
                          msg.sender === userInfo?.nickname
                            ? 'text-green-400'
                            : ''
                        }`}
                      >
                        {msg.sender}
                      </span>
                      <div
                        className={`px-3 py-1.5 rounded-2xl max-w-[85%] ${
                          msg.sender === userInfo?.nickname
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-gray-700/50 text-white'
                        }`}
                      >
                        <span className="text-sm break-words">
                          {msg.content}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* 새 메시지 알림 */}
          {showNewMessageAlert && newMessageCount > 0 && (
            <button
              onClick={scrollToLatestMessage}
              className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-primary-600 hover:bg-primary-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg transition-all duration-200 flex items-center gap-1 z-10 animate-pulse cursor-pointer"
            >
              <span>
                새 메시지 {newMessageCount > 0 && `(${newMessageCount})`}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5M5 12l7 7 7-7" />
              </svg>
            </button>
          )}
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
