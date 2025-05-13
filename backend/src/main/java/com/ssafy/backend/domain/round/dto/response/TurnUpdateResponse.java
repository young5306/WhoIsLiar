package com.ssafy.backend.domain.round.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record TurnUpdateResponse(
	@Schema(description = "현재 턴 정보(몇 번째 턴인지)", example = "1")
	int turn
) {
}
