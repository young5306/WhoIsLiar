package com.ssafy.backend.global.websocket;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

@Slf4j
@Component
public class CustomWebSocketHandler implements WebSocketHandler {

	// 방별 세션 관리용 Map
	private static final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		String token = (String) session.getAttributes().get("token");
		String roomCode = (String) session.getAttributes().get("roomCode");

		if (token == null || roomCode == null) {
			log.warn("Missing token or roomCode in session attributes");
			session.close(CloseStatus.BAD_DATA);
			return;
		}

		roomSessions.computeIfAbsent(roomCode, k -> ConcurrentHashMap.newKeySet()).add(session);

		log.info("[{}] WebSocket 연결 성공 - token: {}, roomCode: {}", session.getId(), token, roomCode);

		broadcastSystemMessage(roomCode, "A new user has entered the room.");
	}

	@Override
	public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
		log.info("메시지 수신 [{}]: {}", session.getId(), message.getPayload());

		String roomCode = (String) session.getAttributes().get("roomCode");
		if (roomCode != null) {
			// 같은 방 사람들에게 메시지 브로드캐스팅
			for (WebSocketSession s : roomSessions.getOrDefault(roomCode, Set.of())) {
				if (s.isOpen()) {
					s.sendMessage(new TextMessage("[Room " + roomCode + "] " + message.getPayload()));
				}
			}
		}
	}

	@Override
	public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
		log.error("WebSocket 에러 발생", exception);
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
		log.info("[{}] WebSocket 연결 종료", session.getId());

		// 방에서 세션 제거
		String roomCode = (String) session.getAttributes().get("roomCode");
		if (roomCode != null) {
			Set<WebSocketSession> sessions = roomSessions.get(roomCode);
			if (sessions != null) {
				sessions.remove(session);
				// 방에 아무도 없으면 방 자체 삭제
				if (sessions.isEmpty()) {
					roomSessions.remove(roomCode);
				}
			}
		}
	}

	@Override
	public boolean supportsPartialMessages() {
		return false;
	}

	private void broadcastSystemMessage(String roomCode, String systemMessage) throws Exception {
		Set<WebSocketSession> sessions = roomSessions.get(roomCode);
		if (sessions != null) {
			for (WebSocketSession s : sessions) {
				if (s.isOpen()) {
					s.sendMessage(new TextMessage("[System] " + systemMessage));
				}
			}
		}
	}
}
