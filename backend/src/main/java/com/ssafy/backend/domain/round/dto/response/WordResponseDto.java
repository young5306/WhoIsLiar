package com.ssafy.backend.domain.round.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "현재(최신) 라운드 단어 조회 응답 DTO")
public record WordResponseDto(
	@Schema(description = "첫 번째 단어", example = "apple")
	String word1,

	@Schema(description = "두 번째 단어 (FOOL 모드일 경우에만 사용)", example = "orange")
	String word2
) {}
