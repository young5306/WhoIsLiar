package com.ssafy.backend.domain.room.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "검색된 방 정보")
public record RoomSearchResponse(
	@Schema(description = "방 이름",            example = "아무나") String roomName,
	@Schema(description = "호스트 닉네임",      example = "그림자은영") String hostNickname,
	@Schema(description = "참여자 수",          example = "3")              int participantsCount,
	@Schema(description = "방 상태",            example = "waiting")        String status,
	@Schema(description = "비공개 여부",        example = "true")           boolean isSecret
) {
}
