package com.ssafy.backend.global.enums;

import org.springframework.http.HttpStatus;

import lombok.Getter;

/**
 * 표준 Response 코드
 */
@Getter
public enum ResponseCode {
	SUCCESS(HttpStatus.OK, "요청이 성공적으로 처리되었습니다."),
	CREATED(HttpStatus.CREATED, "리소스가 성공적으로 생성되었습니다."),
	ACCEPTED(HttpStatus.ACCEPTED, "요청을 수락했습니다. 비동기 처리 중입니다."),

	OPENVIDU_SESSION_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "OpenVidu 세션 처리 중 오류가 발생했습니다."),
	OPENVIDU_CONFLICT(HttpStatus.CONFLICT, "OpenVidu 세션에 이미 접속중입니다."),
	SESSION_CREATING(HttpStatus.LOCKED, "세션이 생성 중입니다. 잠시 후 다시 시도해주세요."),
	INVALID_REQUEST(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."),
	VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "유효성 검사에 실패했습니다."),
	UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
	FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다."),
	NOT_FOUND(HttpStatus.NOT_FOUND, "리소스를 찾을 수 없습니다."),
	METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 메서드입니다."),
	UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "지원하지 않는 콘텐츠 타입입니다."),
	TOO_MANY_REQUESTS(HttpStatus.TOO_MANY_REQUESTS, "요청이 너무 많습니다."),
	CONFLICT(HttpStatus.CONFLICT, "상태 충돌이 발생했습니다."),
	SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버에 오류가 발생했습니다."),
	SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "서비스가 일시 중단되었습니다."),

	ALREADY_IN_ROOM(HttpStatus.CONFLICT, "이미 다른 방에 참여 중이거나 생성한 방이 존재합니다."),
	ROOM_PLAYING(HttpStatus.LOCKED, "게임이 이미 진행중입니다."),
	ROOM_FULL(HttpStatus.CONFLICT, "정원이 초과되었습니다.");

	private final HttpStatus status;
	private final String message;

	ResponseCode(HttpStatus status, String message) {
		this.status = status;
		this.message = message;
	}

}