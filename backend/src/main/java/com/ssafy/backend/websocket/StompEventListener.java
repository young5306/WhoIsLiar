package com.ssafy.backend.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.*;

@Component
public class StompEventListener {
	private static final Logger logger = LoggerFactory.getLogger(StompEventListener.class);

	@EventListener
	public void handleSessionConnected(SessionConnectEvent event) {
		StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
		logger.info("************************************************");
		logger.info("[WS CONNECT] sessionId={} user={}", sha.getSessionId(), sha.getUser());
		logger.info("************************************************");
	}
}
