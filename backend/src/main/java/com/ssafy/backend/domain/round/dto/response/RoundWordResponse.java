package com.ssafy.backend.domain.round.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "라운드 단어 응답 DTO")
public record RoundWordResponse(
	@Schema(description = "단어1", example = "사과") String word1,
	@Schema(description = "단어2 (FOOL 모드 시)", example = "멜론") String word2
) {}
