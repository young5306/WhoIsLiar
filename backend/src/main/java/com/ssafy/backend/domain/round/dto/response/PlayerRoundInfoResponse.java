package com.ssafy.backend.domain.round.dto.response;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "플레이어 라운드 설정 정보 응답 DTO")
public record PlayerRoundInfoResponse(
	@Schema(description = "현재 라운드 번호", example = "1") int roundNumber,
	@Schema(description = "전체 라운드 수", example = "3") int totalRoundNumber,
	@Schema(description = "모든 참가자 순서 목록") List<PlayerPositionInfo> participants,
	@Schema(description = "내 할당 단어 (라이어면 빈 문자열)") String word
) {
	@Schema(description = "참가자 순서 정보")
	public record PlayerPositionInfo(
		@Schema(description = "참가자 닉네임", example = "nickname1") String participantNickname,
		@Schema(description = "순서 번호", example = "1") int order
	) {
	}
}
