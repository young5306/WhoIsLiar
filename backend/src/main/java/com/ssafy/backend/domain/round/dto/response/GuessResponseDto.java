package com.ssafy.backend.domain.round.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "추측 제출 응답 DTO")
public record GuessResponseDto(

	@Schema(description = "정답 여부", example = "true")
	boolean isCorrect,

	@Schema(description = "라운드 승자 ('LIAR' 또는 'CIVIL')", example = "LIAR")
	String winner

) {}
