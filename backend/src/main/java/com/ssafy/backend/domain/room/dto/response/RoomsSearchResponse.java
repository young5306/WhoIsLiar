package com.ssafy.backend.domain.room.dto.response;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "방 검색 응답 DTO")
public record RoomsSearchResponse(
	@Schema(description = "검색된 방 목록") List<RoomSearchResponse> rooms
) {
}
