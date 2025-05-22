package com.ssafy.backend.global.common;

import com.ssafy.backend.global.enums.ResponseCode;

import lombok.Getter;
import lombok.Setter;

/**
 * 공통 API 응답 포맷
 */
@Getter
@Setter
public class CommonResponse<T> {
	private String code;
	private boolean success;
	private String message;
	private T data;

	public CommonResponse(String code, boolean success, String message, T data) {
		this.code = code;
		this.success = success;
		this.message = message;
		this.data = data;
	}

	public static <T> CommonResponse<T> success(ResponseCode rc, T data) {
		return new CommonResponse<>(rc.name(), true, rc.getMessage(), data);
	}

	public static <T> CommonResponse<T> failure(ResponseCode rc) {
		return new CommonResponse<>(rc.name(), false, rc.getMessage(), null);
	}
}