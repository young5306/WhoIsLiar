package com.ssafy.backend.domain.chat.event;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import com.ssafy.backend.domain.chat.dto.ChatMessage;
import com.ssafy.backend.global.enums.ChatType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompSubscribeEventListener {

	private final SimpMessagingTemplate messagingTemplate;
	private final ChatSessionRegistry sessionRegistry;

	@EventListener
	public void handleSubscribeEvent(SessionSubscribeEvent event) {
		StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
		String destination = accessor.getDestination();
		String sessionId = accessor.getSessionId();

		log.info("************************************************");
		log.info("[WS SUBSCRIBE] 구독 이벤트 감지 - destination: {}, sessionId: {}", destination, sessionId);

		// destination 유효성 확인
		if (destination != null && destination.startsWith("/topic/room.")
			&& !destination.contains(".emotion")) {

			// sessionRegistry.register(sessionId);

			String nickname = (String)accessor.getSessionAttributes().get("nickname");

			if (nickname == null) {
				nickname = "알 수 없음";
			}

			String message = nickname + "님이 입장하셨습니다.";
			log.info("[WS GameMessage] {}님이 입장하셨습니다.", nickname);

			ChatMessage systemMessage = new ChatMessage(
				"SYSTEM",
				message,
				ChatType.PLAYER_JOIN
			);

			messagingTemplate.convertAndSend(destination, systemMessage);
		}
		log.info("************************************************");
	}
}
