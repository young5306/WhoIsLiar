package com.ssafy.backend.domain.room.dto.request;

import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.global.enums.Mode;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@Builder
@Schema(description = "방 생성 요청 DTO")
public record RoomCreateRequest(

	@Schema(description = "호스트 닉네임", example = "그림자은영")
	String hostNickname,

	@Schema(description = "방 모드", example = "VIDEO")
	Mode mode,

	@Schema(description = "방 제목", example = "재밌는 방")
	String roomName,

	@Schema(description = "비밀번호", example = "1234", nullable = true)
	String password,

	@Schema(description = "라운드 수", example = "5")
	int roundCount
) {}
