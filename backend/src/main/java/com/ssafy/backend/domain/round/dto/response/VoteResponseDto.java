package com.ssafy.backend.domain.round.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "투표 제출 응답 DTO")
public record VoteResponseDto(
	@Schema(description = "투표한 참가자 ID", example = "10")
	Long participantId,

	@Schema(description = "투표 대상 참가자 ID; 스킵 시 null", example = "15", nullable = true)
	Long targetParticipantId
) {}
