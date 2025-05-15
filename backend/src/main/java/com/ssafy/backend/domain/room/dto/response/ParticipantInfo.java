package com.ssafy.backend.domain.room.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record ParticipantInfo(
	@Schema(description = "참가자 ID", example = "1")
	Long participantId,

	@Schema(description = "참가자 닉네임", example = "그림자은영")
	String nickName,

	@Schema(description = "현재 활성 상태", example = "true")
	boolean isActive
) {
}
