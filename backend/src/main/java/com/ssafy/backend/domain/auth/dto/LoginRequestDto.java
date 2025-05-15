package com.ssafy.backend.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LoginRequestDto(
	@NotBlank(message = "닉네임을 입력해주세요.")
	@Size(min = 2, max = 10, message = "닉네임은 2~10자여야 합니다.")
	@Pattern(regexp = "^[A-Za-z0-9가-힣]+$", message = "닉네임은 영어, 한글, 숫자만 사용할 수 있습니다.")
	String nickname
) {
}
