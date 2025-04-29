package com.ssafy.backend.global.common;

import lombok.Getter;
import lombok.Setter;

/**
 * 공통 API 응답 포맷
 */
@Getter
@Setter
public class ApiResponse<T> {
	private String code;
	private boolean success;
	private String message;
	private T data;

	public ApiResponse(String code, boolean success, String message, T data) {
		this.code = code;
		this.success = success;
		this.message = message;
		this.data = data;
	}

	public static <T> ApiResponse<T> success(ResponseCode rc, T data) {
		return new ApiResponse<>(rc.name(), true, rc.getMessage(), data);
	}

	public static <T> ApiResponse<T> failure(ResponseCode rc) {
		return new ApiResponse<>(rc.name(), false, rc.getMessage(), null);
	}
}