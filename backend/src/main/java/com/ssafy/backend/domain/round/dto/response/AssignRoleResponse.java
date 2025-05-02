package com.ssafy.backend.domain.round.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "라운드 역할 할당 응답 DTO")
public record AssignRoleResponse(
	@Schema(description = "라이어 참가자 ID", example = "1")
	Long liarParticipantId,

	@Schema(description = "라이어 닉네임", example = "김상욱")
	String liarNickname
) {}
