package com.ssafy.backend.global.websocket;

import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

@Slf4j
@Component
public class CustomWebSocketHandler implements WebSocketHandler {

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		log.info("WebSocket 연결 성공: " + session.getAttributes().get("token"));
	}

	@Override
	public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
		log.info("메시지 수신: " + message.getPayload());
		session.sendMessage(new TextMessage("Echo: " + message.getPayload()));
	}

	@Override
	public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
		log.error("WebSocket 에러 발생", exception);
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
		log.info("WebSocket 연결 종료");
	}

	@Override
	public boolean supportsPartialMessages() {
		return false;
	}
}
