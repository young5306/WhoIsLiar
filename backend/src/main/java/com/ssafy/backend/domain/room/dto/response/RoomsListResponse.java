package com.ssafy.backend.domain.room.dto.response;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "방 목록 응답 DTO")
public record RoomsListResponse(
	@Schema(description = "방 목록", example = "[]")
	List<RoomInfo> rooms
) {
}
