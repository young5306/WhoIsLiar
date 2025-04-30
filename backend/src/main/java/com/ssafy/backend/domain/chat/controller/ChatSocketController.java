package com.ssafy.backend.domain.chat.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.ssafy.backend.domain.chat.dto.ChatMessage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatSocketController {

	private final SimpMessagingTemplate messagingTemplate;

	@MessageMapping("/chat.send/{roomCode}")
	public void sendMessage(@DestinationVariable String roomCode, @Payload ChatMessage message) {
		log.info("메시지 수신 - roomCode: {}, sender: {}, content: {}", roomCode, message.sender(), message.content());

		// /topic/room.{roomCode} 구독자에게 메시지 전송
		messagingTemplate.convertAndSend("/topic/room." + roomCode, message);
	}
}
