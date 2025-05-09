package com.ssafy.backend.domain.round.dto.request;

import jakarta.validation.constraints.NotNull;

public record VoteRequestDto(
	/** 스킵 시 null */
	String targetParticipantNickname
) {}
