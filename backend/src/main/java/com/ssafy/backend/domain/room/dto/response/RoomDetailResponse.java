package com.ssafy.backend.domain.room.dto.response;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "방 상세 정보 응답 DTO")
public record RoomDetailResponse(
	@Schema(description = "방 기본 정보") RoomInfo roomInfo,
	@Schema(description = "참가자 목록") List<ParticipantInfo> participants
) { }
