package com.ssafy.backend.domain.chat.dto;

import com.ssafy.backend.global.enums.ChatType;

public record ChatMessage(
	String sender,
	String content,
	ChatType chatType
) {}
