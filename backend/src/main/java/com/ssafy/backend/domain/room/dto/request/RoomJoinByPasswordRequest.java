package com.ssafy.backend.domain.room.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RoomJoinByPasswordRequest(
	@Schema(description = "방 코드", example = "asdf12")
	@NotBlank(message = "방 코드는 필수입니다.")
	@Pattern(regexp = "^[A-Za-z0-9]{6}$", message = "방 코드는 6자리 영문·숫자이어야 합니다.")
	String roomCode,

	@Schema(description = "비밀번호", example = "1234")
	@Pattern(
		regexp = "^$|\\d{4}",
		message = "비밀번호는 비워두거나 숫자 4자리여야 합니다."
	)
	String password
) {
}
