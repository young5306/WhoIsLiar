package com.ssafy.backend.domain.chat.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.ssafy.backend.domain.chat.dto.ChatMessage;
import com.ssafy.backend.global.enums.Category;
import com.ssafy.backend.global.enums.ChatType;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatSocketService {

	private final SimpMessagingTemplate messagingTemplate;

	private void sendSystemMessage(String roomCode, String content, ChatType type) {
		ChatMessage message = new ChatMessage("SYSTEM", content, type);
		messagingTemplate.convertAndSend("/topic/room." + roomCode, message);
	}

	private void sendAfterCommit(String roomCode, String content, ChatType type) {
		if (TransactionSynchronizationManager.isSynchronizationActive()) {
			TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
				@Override
				public void afterCommit() {
					sendSystemMessage(roomCode, content, type);
				}
			});
		} else {
			sendSystemMessage(roomCode, content, type);
		}
	}

	public void playerLeft(String roomCode, String nickname) {
		sendAfterCommit(roomCode, nickname + "님이 퇴장하였습니다.", ChatType.PLAYER_LEAVE);
	}

	public void playerJoined(String roomCode, String nickname) {
		sendAfterCommit(roomCode, nickname + "님이 입장하였습니다.", ChatType.PLAYER_JOIN);
	}

	public void gameStarted(String roomCode) {
		sendAfterCommit(roomCode, "게임이 시작되었습니다.", ChatType.GAME_START);
	}

	public void gameEnded(String roomCode) {
		sendAfterCommit(roomCode, "게임이 종료되었습니다.", ChatType.GAME_END);
	}

	public void roundStarted(String roomCode, int roundNumber) {
		sendAfterCommit(roomCode, roundNumber + "라운드가 시작되었습니다.", ChatType.ROUND_START);
	}

	public void roundEnded(String roomCode, int roundNumber) {
		sendAfterCommit(roomCode, roundNumber + "라운드가 종료되었습니다.", ChatType.ROUND_END);
	}

	public void sendTurnStart(String roomCode, String nickname, int turnDurationSeconds) {
		sendSystemMessage(roomCode, nickname + "님의 발언 차례입니다. (" + turnDurationSeconds + "초)", ChatType.TURN_START);
	}

	public void sendTurnEnd(String roomCode, String nickname) {
		sendSystemMessage(roomCode, nickname + "님의 발언 시간이 종료되었습니다.", ChatType.TURN_END);
	}

	public void roundFullyEnded(String roomCode) {
		sendSystemMessage(roomCode, "모든 플레이어의 차례가 끝났습니다.", ChatType.ROUND_END);
	}

	public void categorySelected(String roomCode, Category category) {
		sendAfterCommit(roomCode, category + "가 선택되었습니다.", ChatType.CATEGORY_SELECTED);
	}
}

