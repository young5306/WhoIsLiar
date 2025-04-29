package com.ssafy.backend.global.common;

import org.springframework.http.ResponseEntity;

/**
 * 유틸리티 빌더
 */
public class ResponseUtil {
	public static <T> ResponseEntity<ApiResponse<T>> ok(T data) {
		ApiResponse<T> body = ApiResponse.success(ResponseCode.SUCCESS, data);
		return new ResponseEntity<>(body, ResponseCode.SUCCESS.getStatus());
	}

	public static <T> ResponseEntity<ApiResponse<T>> created(T data) {
		ApiResponse<T> body = ApiResponse.success(ResponseCode.CREATED, data);
		return new ResponseEntity<>(body, ResponseCode.CREATED.getStatus());
	}

	public static <T> ResponseEntity<ApiResponse<T>> accepted(T data) {
		ApiResponse<T> body = ApiResponse.success(ResponseCode.ACCEPTED, data);
		return new ResponseEntity<>(body, ResponseCode.ACCEPTED.getStatus());
	}

	public static ResponseEntity<ApiResponse<Void>> error(ResponseCode rc) {
		ApiResponse<Void> body = ApiResponse.failure(rc);
		return new ResponseEntity<>(body, rc.getStatus());
	}
}

