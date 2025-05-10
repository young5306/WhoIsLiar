package com.ssafy.backend.domain.chat.dto;

import java.util.Map;

public record EmotionResult(
	Map<String, Double> expressions,
	TopEmotion topEmotion
) {}

