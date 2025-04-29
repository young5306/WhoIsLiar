package com.ssafy.backend.domain.room.controller;

import com.ssafy.backend.domain.room.dto.request.RoomCreateRequest;
import com.ssafy.backend.domain.room.dto.request.RoomJoinByCodeRequest;
import com.ssafy.backend.domain.room.dto.response.RoomCreateResponse;
import com.ssafy.backend.domain.room.dto.response.RoomJoinByCodeResponse;
import com.ssafy.backend.domain.room.service.RoomService;
import com.ssafy.backend.global.common.ApiResponse;
import com.ssafy.backend.global.common.ResponseCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rooms")
@Tag(name = "방 API", description = "방 생성 관련 API")
public class RoomController {

	private final RoomService roomService;

	@PostMapping
	@Operation(summary = "방 생성", description = "새로운 방을 생성합니다.")
	public ApiResponse<RoomCreateResponse> createRoom(@RequestBody RoomCreateRequest request) {
		RoomCreateResponse response = roomService.createRoom(request);
		return ApiResponse.success(ResponseCode.CREATED, response);
	}

	@PostMapping("/join/code")
	@Operation(summary = "코드로 방 입장", description = "코드로 방에 입장합니다.")
	public ApiResponse<RoomJoinByCodeResponse> joinRoomByCode(@RequestBody RoomJoinByCodeRequest request) {
		RoomJoinByCodeResponse response = roomService.joinRoomByCode(request);
		return ApiResponse.success(ResponseCode.SUCCESS, response);
	}
}
