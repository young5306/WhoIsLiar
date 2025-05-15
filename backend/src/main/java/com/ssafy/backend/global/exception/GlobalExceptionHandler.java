package com.ssafy.backend.global.exception;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.ssafy.backend.global.common.CommonResponse;
import com.ssafy.backend.global.enums.ResponseCode;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 전역 예외 처리
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public CommonResponse<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
		Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
			.collect(Collectors.toMap(
				FieldError::getField,
				FieldError::getDefaultMessage,
				(existing, replacement) -> existing
			));
		return CommonResponse.success(ResponseCode.VALIDATION_ERROR, errors);
	}

	@ExceptionHandler(NoSuchElementException.class)
	@ResponseStatus(HttpStatus.NOT_FOUND)
	public CommonResponse<Void> handleNoSuch(NoSuchElementException ex) {
		ex.printStackTrace();
		return CommonResponse.failure(ResponseCode.NOT_FOUND);
	}

	@ExceptionHandler(CustomException.class)
	public ResponseEntity<CommonResponse<Void>> handleCustom(CustomException ex) {
		ResponseCode rc = ex.getResponseCode();
		return new ResponseEntity<>(CommonResponse.failure(rc), rc.getStatus());
	}

	@ExceptionHandler(Exception.class)
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	public CommonResponse<Void> handleGeneral(Exception ex, HttpServletRequest req) {
		ex.printStackTrace();
		return CommonResponse.failure(ResponseCode.SERVER_ERROR);
	}
}
