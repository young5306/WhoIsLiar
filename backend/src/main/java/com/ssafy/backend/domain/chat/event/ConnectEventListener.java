package com.ssafy.backend.domain.chat.event;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class ConnectEventListener {

	private final ChatSessionRegistry sessionRegistry;

	@EventListener
	public void handleSessionConnect(SessionConnectEvent event) {
		StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
		String sessionId = sha.getSessionId();
		log.debug("[WS CONNECT] sessionId={} 등록", sessionId);
		sessionRegistry.register(sessionId);
	}
}
