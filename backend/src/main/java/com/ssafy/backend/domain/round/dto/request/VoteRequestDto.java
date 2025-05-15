package com.ssafy.backend.domain.round.dto.request;

public record VoteRequestDto(
	/** 스킵 시 null */
	String targetParticipantNickname
) {
}
