package com.ssafy.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequestDto(
	@NotBlank(message = "닉네임을 입력해주세요.")
	String nickname
) {}
