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

import com.ssafy.backend.global.common.ApiResponse;
import com.ssafy.backend.global.common.ResponseCode;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 전역 예외 처리
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ApiResponse<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
		Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
			.collect(Collectors.toMap(
				FieldError::getField,
				FieldError::getDefaultMessage,
				(existing, replacement) -> existing
			));
		return ApiResponse.success(ResponseCode.VALIDATION_ERROR,errors);
	}

	@ExceptionHandler(NoSuchElementException.class)
	@ResponseStatus(HttpStatus.NOT_FOUND)
	public ApiResponse<Void> handleNoSuch(NoSuchElementException ex) {
		return ApiResponse.failure(ResponseCode.NOT_FOUND);
	}

	@ExceptionHandler(CustomException.class)
	public ResponseEntity<ApiResponse<Void>> handleCustom(CustomException ex) {
		ResponseCode rc = ex.getResponseCode();
		return new ResponseEntity<>(ApiResponse.failure(rc), rc.getStatus());
	}

	@ExceptionHandler(Exception.class)
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	public ApiResponse<Void> handleGeneral(Exception ex, HttpServletRequest req) {
		ex.printStackTrace();
		return ApiResponse.failure(ResponseCode.SERVER_ERROR);
	}
}
