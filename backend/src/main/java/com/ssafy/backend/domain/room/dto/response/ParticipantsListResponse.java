package com.ssafy.backend.domain.room.dto.response;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "방 참가자 목록 응답 DTO")
public record ParticipantsListResponse(
	@Schema(description = "참가자 목록") List<ParticipantInfo> participants
) {
}
