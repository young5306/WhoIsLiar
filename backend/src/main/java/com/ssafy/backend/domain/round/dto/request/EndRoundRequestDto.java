package com.ssafy.backend.domain.round.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Schema(description = "라운드 종료 요청 DTO")
public record EndRoundRequestDto(

	@Schema(description = "방 코드", example = "abcd12", required = true)
	@NotBlank(message = "roomCode는 필수입니다.")
	@Pattern(regexp = "^[A-Za-z0-9]{6}$", message = "방 코드는 6자리 영문·숫자이어야 합니다.")
	String roomCode,

	@Schema(description = "라운드 번호", example = "3", required = true)
	@Min(value = 1, message = "roundNumber는 1 이상이어야 합니다.")
	int roundNumber

) {}