package com.ssafy.backend.domain.chat.dto;

public record EmotionBroadcastMessage(
	String roomCode,
	int order,
	String userName,
	EmotionResult emotionResult
) {
}
