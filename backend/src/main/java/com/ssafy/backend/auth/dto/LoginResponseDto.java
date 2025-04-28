package com.ssafy.backend.auth.dto;

public record LoginResponseDto(String token, String nickname, boolean available) { }
