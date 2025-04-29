package com.ssafy.backend.domain.room.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@Builder
@Schema(description = "방 세부 정보 DTO")
public record RoomInfo(

	@Schema(description = "방 이름", example = "아무나")
	String roomName,

	@Schema(description = "방 코드", example = "asdf1234")
	String roomCode,

	@Schema(description = "비밀번호 존재 여부", example = "true")
	boolean isSecret,

	@Schema(description = "현재 인원 수", example = "1")
	int playerCount,

	@Schema(description = "총 라운드 수", example = "5")
	int roundCount,

	@Schema(description = "방 모드", example = "video")
	String mode,

	@Schema(description = "카테고리", example = "랜덤")
	String category,

	@Schema(description = "방장 닉네임", example = "김상욱")
	String hostNickname,

	@Schema(description = "방 상태", example = "waiting")
	String status

) {}
