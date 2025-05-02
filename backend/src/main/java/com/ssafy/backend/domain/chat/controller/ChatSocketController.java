package com.ssafy.backend.domain.chat.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.ssafy.backend.domain.chat.dto.ChatMessage;
import com.ssafy.backend.global.enums.ChatType;

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

	@MessageMapping("/game.start/{roomCode}")
	public void startGame(@DestinationVariable String roomCode) {
		ChatMessage message = new ChatMessage(
			"SYSTEM",
			"게임이 시작되었습니다.",
			ChatType.GAME_START
		);
		messagingTemplate.convertAndSend("/topic/room." + roomCode, message);
	}

	@MessageMapping("/game.end/{roomCode}")
	public void endGame(@DestinationVariable String roomCode) {
		ChatMessage message = new ChatMessage(
			"SYSTEM",
			"게임이 종료되었습니다.",
			ChatType.GAME_END);
		messagingTemplate.convertAndSend("/topic/room." + roomCode, message);
	}

	@MessageMapping("/game.forceend/{roomCode}")
	public void forceEndGame(@DestinationVariable String roomCode) {
		ChatMessage message = new ChatMessage(
			"SYSTEM",
			"게임이 강제 종료되었습니다.",
			ChatType.GAME_FORCE_END);
		messagingTemplate.convertAndSend("/topic/room." + roomCode, message);
	}

	@MessageMapping("/round.start/{roomCode}")
	public void startRound(@DestinationVariable String roomCode, @Header("roundNumber") int roundNumber) {
		ChatMessage message = new ChatMessage(
			"SYSTEM",
			roundNumber + "라운드가 시작되었습니다.",
			ChatType.ROUND_START);
		messagingTemplate.convertAndSend("/topic/room." + roomCode, message);
	}

	@MessageMapping("/round.end/{roomCode}")
	public void endRound(@DestinationVariable String roomCode, @Header("roundNumber") int roundNumber) {
		ChatMessage message = new ChatMessage(
			"SYSTEM",
			roundNumber + "라운드가 종료되었습니다.",
			ChatType.ROUND_END);
		messagingTemplate.convertAndSend("/topic/room." + roomCode, message);
	}

	@MessageMapping("/player.leave/{roomCode}")
	public void leavePlayer(@DestinationVariable String roomCode, @Header("nickname") String nickname) {
		ChatMessage message = new ChatMessage(
			"SYSTEM",
			nickname + "님이 퇴장했습니다.",
			ChatType.PLAYER_LEAVE);
		messagingTemplate.convertAndSend("/topic/room." + roomCode, message);
	}

}
