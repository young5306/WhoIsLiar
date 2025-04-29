package com.ssafy.backend.domain.room.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@Builder
@Schema(description = "방 생성 응답 DTO")
public record RoomCreateResponse(

	@Schema(description = "방 정보")
	RoomInfo room

) {}
