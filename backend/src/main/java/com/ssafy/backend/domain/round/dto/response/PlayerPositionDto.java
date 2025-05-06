package com.ssafy.backend.domain.round.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "참가자 순서 정보")
public record PlayerPositionDto(
	@Schema(description = "참가자 고유 ID", example = "101")
	Long participantId,

	@Schema(description = "라운드 내 순서 번호", example = "1")
	int order
) {}
