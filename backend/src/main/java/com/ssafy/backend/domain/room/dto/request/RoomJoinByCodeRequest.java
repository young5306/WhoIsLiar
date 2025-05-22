package com.ssafy.backend.domain.room.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RoomJoinByCodeRequest(
	@Schema(description = "방 코드", example = "asdf12")
	@NotBlank(message = "방 코드는 필수입니다.")
	@Pattern(regexp = "^[A-Za-z0-9]{6}$", message = "방 코드는 6자리 영문·숫자이어야 합니다.")
	String roomCode
) {
}
