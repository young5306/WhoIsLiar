package com.ssafy.backend.domain.room.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

public record RoomJoinResponse(
	@Schema(description = "방 정보")
	RoomInfo roomInfo,

	@Schema(description = "참가자 목록")
	List<ParticipantInfo> participants
) {}
