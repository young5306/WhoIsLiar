package com.ssafy.backend.domain.round.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "투표 제출 응답 DTO")
public record VoteResponseDto(
	@Schema(description = "투표한 참가자 닉네임", example = "user_02")
	String participantNickname,

	@Schema(description = "투표 대상 참가자 닉네임; 스킵 시 null", example = "user_05", nullable = true)
	String targetParticipantNickname
) {}
