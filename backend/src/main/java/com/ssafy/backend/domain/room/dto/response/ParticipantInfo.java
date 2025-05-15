package com.ssafy.backend.domain.room.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record ParticipantInfo(
	@Schema(description = "참가자 ID", example = "1")
	Long participantId,

	@Schema(description = "참가자 닉네임", example = "그림자은영")
	String nickName,

	@Schema(description = "현재 활성 상태", example = "true")
	boolean isActive,

	@Schema(description = "유저의 준비 상태", example = "false")
	boolean readyStatus,

	@Schema(description = "호스트 여부", example = "false")
	boolean isHost

) {}
