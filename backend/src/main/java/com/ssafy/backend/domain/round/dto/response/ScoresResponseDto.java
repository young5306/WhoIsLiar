package com.ssafy.backend.domain.round.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "방별 누적 점수 조회 응답 DTO")
public record ScoresResponseDto(

	@Schema(description = "참가자별 총 점수 목록")
	List<ScoreEntry> scores

) {
	@Schema(description = "참가자 점수 항목")
	public record ScoreEntry(
		@Schema(description = "참가자 닉네임", example = "user_01")
		String participantNickname,

		@Schema(description = "총 점수", example = "45")
		int totalScore
	) {}
}
