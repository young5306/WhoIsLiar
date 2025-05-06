package com.ssafy.backend.domain.round.dto.response;


import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "플레이어 라운드 설정 정보 응답 DTO")
public record PlayerRoundInfoResponse(
	@Schema(description = "모든 참가자 순서 목록")
	List<PlayerPositionDto> participants,

	@Schema(description = "내 할당 단어 (default 모드에서 라이어인 경우 빈 문자열)")
	String word
) {}
