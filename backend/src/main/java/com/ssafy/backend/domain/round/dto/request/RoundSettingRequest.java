package com.ssafy.backend.domain.round.dto.request;

import com.ssafy.backend.global.enums.Category;
import com.ssafy.backend.global.enums.GameMode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@Schema(description = "라운드 설정 요청 DTO")
public record RoundSettingRequest(
	@Schema(description = "방 코드", example = "abcd12")
	@NotBlank(message = "방 코드를 입력해주세요.")
	@Pattern(regexp = "^[A-Za-z0-9]{6}$", message = "방 코드는 6자리 영문·숫자이어야 합니다.")
	String roomCode
) {}
