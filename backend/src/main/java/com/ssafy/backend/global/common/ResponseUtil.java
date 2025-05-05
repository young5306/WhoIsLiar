package com.ssafy.backend.global.common;

import org.springframework.http.ResponseEntity;

/**
 * 유틸리티 빌더
 */
public class ResponseUtil {
	public static <T> ResponseEntity<CommonResponse<T>> ok(T data) {
		CommonResponse<T> body = CommonResponse.success(ResponseCode.SUCCESS, data);
		return new ResponseEntity<>(body, ResponseCode.SUCCESS.getStatus());
	}

	public static <T> ResponseEntity<CommonResponse<T>> created(T data) {
		CommonResponse<T> body = CommonResponse.success(ResponseCode.CREATED, data);
		return new ResponseEntity<>(body, ResponseCode.CREATED.getStatus());
	}

	public static <T> ResponseEntity<CommonResponse<T>> accepted(T data) {
		CommonResponse<T> body = CommonResponse.success(ResponseCode.ACCEPTED, data);
		return new ResponseEntity<>(body, ResponseCode.ACCEPTED.getStatus());
	}

	public static ResponseEntity<CommonResponse<Void>> error(ResponseCode rc) {
		CommonResponse<Void> body = CommonResponse.failure(rc);
		return new ResponseEntity<>(body, rc.getStatus());
	}
}

