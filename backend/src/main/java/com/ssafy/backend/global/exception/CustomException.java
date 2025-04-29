package com.ssafy.backend.global.exception;

import com.ssafy.backend.global.common.ResponseCode;

/**
 * 커스텀 예외 클래스
 */
public class CustomException extends RuntimeException {
	private final ResponseCode responseCode;

	public CustomException(ResponseCode responseCode) {
		super(responseCode.getMessage());
		this.responseCode = responseCode;
	}

	public ResponseCode getResponseCode() {
		return responseCode;
	}
}
