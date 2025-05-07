package com.ssafy.backend.domain.round.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "투표 결과 응답 DTO")
public record VoteResultsResponseDto(

	@Schema(description = "각 대상별 득표 수 목록")
	List<Result> results,

	@Schema(description = "스킵 처리 여부", example = "true")
	boolean skip,

	@Schema(description = "추방된 참가자 ID; 스킵 시 null", example = "10", nullable = true)
	Long selected,

	@Schema(description = "정답(라이어)과 일치하는지 여부; 스킵 시 null", example = "true", nullable = true)
	Boolean detected,

	@Schema(description = "실제 라이어 닉네임; 스킵 시 null", example = "user_05", nullable = true)
	String liarNickname,

	@Schema(description = "실제 라이어 참가자 ID; 스킵 시 null", example = "1234", nullable = true)
	Long liarId

) {
	@Schema(description = "득표 수 결과 항목")
	public record Result(
		@Schema(description = "투표 대상 참가자 ID", example = "5")
		Long targetId,

		@Schema(description = "투표 수", example = "3")
		int voteCount
	) {}
}
