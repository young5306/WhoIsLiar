package com.ssafy.backend.domain.auth.dto;

public record LoginResponseDto(
	String token,
	String nickname
) { }
