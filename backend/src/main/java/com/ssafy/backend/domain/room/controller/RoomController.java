package com.ssafy.backend.domain.room.controller;

import static com.ssafy.backend.global.common.ResponseUtil.*;

import com.ssafy.backend.domain.room.dto.request.RoomCreateRequest;
import com.ssafy.backend.domain.room.dto.request.RoomJoinByCodeRequest;
import com.ssafy.backend.domain.room.dto.response.ParticipantsListResponse;
import com.ssafy.backend.domain.room.dto.response.RoomCreateResponse;
import com.ssafy.backend.domain.room.dto.response.RoomDetailResponse;
import com.ssafy.backend.domain.room.dto.response.RoomJoinByCodeResponse;
import com.ssafy.backend.domain.room.dto.response.RoomsListResponse;
import com.ssafy.backend.domain.room.dto.response.RoomsSearchResponse;
import com.ssafy.backend.domain.room.service.RoomService;
import com.ssafy.backend.global.common.ApiResponse;
import com.ssafy.backend.global.common.ResponseCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rooms")
@Tag(name = "방 API", description = "방 생성 관련 API")
public class RoomController {

	private final RoomService roomService;

	@PostMapping
	@Operation(summary = "방 생성", description = "새로운 방을 생성합니다.")
	public ResponseEntity<ApiResponse<RoomCreateResponse>> createRoom(
		@RequestBody RoomCreateRequest request) {
		RoomCreateResponse dto = roomService.createRoom(request);
		return created(dto);
	}

	@PostMapping("/join/code")
	@Operation(summary = "코드로 방 입장", description = "코드로 방에 입장합니다.")
	public ResponseEntity<ApiResponse<RoomJoinByCodeResponse>> joinRoomByCode(
		@RequestBody RoomJoinByCodeRequest request) {
		RoomJoinByCodeResponse dto = roomService.joinRoomByCode(request);
		return ok(dto);
	}

	/** 방 목록 조회 */
	@GetMapping
	@Operation(summary = "방 목록 조회", description = "현재 생성된 모든 방 목록을 조회합니다.")
	@io.swagger.v3.oas.annotations.responses.ApiResponses({
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
			content = @io.swagger.v3.oas.annotations.media.Content(
				mediaType = "application/json",
				schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = RoomsListResponse.class)
			)),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요", content = @io.swagger.v3.oas.annotations.media.Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음", content = @io.swagger.v3.oas.annotations.media.Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류", content = @io.swagger.v3.oas.annotations.media.Content)
	})
	public ResponseEntity<ApiResponse<RoomsListResponse>> listRooms() {
		RoomsListResponse dto = roomService.getRoomsList();
		return ok(dto);
	}

	/** 방 참가자 조회 */
	@GetMapping("/{roomCode}/participants")
	@Operation(summary = "방 참가자 조회", description = "주어진 roomCode에 속한 참가자 목록을 조회합니다.")
	@io.swagger.v3.oas.annotations.responses.ApiResponses({
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
			content = @Content(mediaType = "application/json",
				schema = @Schema(implementation = ParticipantsListResponse.class))),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요", content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음",  content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "방을 찾을 수 없음", content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류",  content = @Content)
	})
	public ResponseEntity<ApiResponse<ParticipantsListResponse>> getParticipants(
		@PathVariable String roomCode) {
		ParticipantsListResponse dto = roomService.getParticipants(roomCode);
		return ok(dto);
	}

	/** 방 이름으로 검색 */
	@GetMapping(params = "roomName")
	@Operation(summary = "방 검색", description = "roomName을 포함하는 방 목록을 조회합니다.")
	@io.swagger.v3.oas.annotations.responses.ApiResponses({
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "검색 성공",
			content = @Content(mediaType = "application/json",
				schema = @Schema(implementation = RoomsSearchResponse.class))),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청(파라미터 누락·형식 오류)",        content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요",                               content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음",                               content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류",                               content = @Content)
	})
	public ResponseEntity<ApiResponse<RoomsSearchResponse>> searchRooms(
		@RequestParam String roomName) {
		RoomsSearchResponse dto = roomService.searchRooms(roomName);
		return ok(dto);
	}

	/**
	 * 방 상세 조회
	 * GET /api/rooms/{roomCode}
	 */
	@GetMapping("/{roomCode}")
	@Operation(summary = "방 상세 조회", description = "roomCode에 해당하는 방 정보와 참가자 목록을 반환합니다.")
	@io.swagger.v3.oas.annotations.responses.ApiResponses({
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
			content = @io.swagger.v3.oas.annotations.media.Content(
				mediaType = "application/json",
				schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = RoomDetailResponse.class)
			)
		),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요", content = @io.swagger.v3.oas.annotations.media.Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음", content = @io.swagger.v3.oas.annotations.media.Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "방을 찾을 수 없음", content = @io.swagger.v3.oas.annotations.media.Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류", content = @io.swagger.v3.oas.annotations.media.Content)
	})
	public ResponseEntity<ApiResponse<RoomDetailResponse>> getRoomByCode(
		@PathVariable String roomCode) {
		RoomDetailResponse dto = roomService.getRoomDetail(roomCode);
		return ok(dto);
	}
}
