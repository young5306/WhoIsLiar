package com.ssafy.backend.domain.chat.event;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * 실제 구독된 STOMP 세션 ID만 관리하는 Registry
 */
@Component
public class ChatSessionRegistry {
	private final Set<String> sessions = ConcurrentHashMap.newKeySet();

	/** 구독 시 호출 */
	public void register(String sessionId) {
		sessions.add(sessionId);
	}

	/** Disconnect 시 호출 — true면 한 번만 처리 */
	public boolean unregister(String sessionId) {
		return sessions.remove(sessionId);
	}
}
