package com.ssafy.backend.domain.room.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record RoomJoinByCodeRequest(
	@Schema(description = "방 코드", example = "asdf12")
	@NotBlank(message = "방 코드는 필수입니다.")
	String roomCode
) {}
