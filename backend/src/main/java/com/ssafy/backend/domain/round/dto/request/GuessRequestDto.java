package com.ssafy.backend.domain.round.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "추측 제출 요청 DTO")
public record GuessRequestDto(

	@Schema(description = "추측 텍스트", example = "apple", required = true)
	String guessText

) {
}
