package com.ssafy.backend.domain.room.controller;

import static com.ssafy.backend.global.common.ResponseUtil.*;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.backend.domain.room.dto.request.GameStartRequest;
import com.ssafy.backend.domain.room.dto.request.RoomCreateRequest;
import com.ssafy.backend.domain.room.dto.request.RoomJoinByCodeRequest;
import com.ssafy.backend.domain.room.dto.request.RoomJoinByPasswordRequest;
import com.ssafy.backend.domain.room.dto.request.SelectCategoryRequest;
import com.ssafy.backend.domain.room.dto.response.ParticipantsListResponse;
import com.ssafy.backend.domain.room.dto.response.RoomCreateResponse;
import com.ssafy.backend.domain.room.dto.response.RoomDetailResponse;
import com.ssafy.backend.domain.room.dto.response.RoomsListResponse;
import com.ssafy.backend.domain.room.dto.response.RoomsSearchResponse;
import com.ssafy.backend.domain.room.service.RoomService;
import com.ssafy.backend.global.common.CommonResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rooms")
@Tag(name = "방 API", description = "방 생성 관련 API")
@Validated
public class RoomController {

	private final RoomService roomService;

	@PostMapping
	@Operation(summary = "방 생성", description = "새로운 방을 생성합니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "201", description = "생성 성공",
			content = @Content(schema = @Schema(implementation = RoomCreateResponse.class))),
		@ApiResponse(responseCode = "400", description = "잘못된 요청", content = @Content),
		@ApiResponse(responseCode = "401", description = "인증 필요", content = @Content),
		@ApiResponse(responseCode = "403", description = "권한 없음", content = @Content),
		@ApiResponse(responseCode = "409", description = "이미 다른 방에 참여 중이거나 생성한 방이 존재합니다.", content = @Content),
		@ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
	})
	public ResponseEntity<CommonResponse<RoomCreateResponse>> createRoom(
		@Parameter(description = "방 생성 요청 정보", required = true)
		@Valid
		@RequestBody RoomCreateRequest request) {
		RoomCreateResponse response = roomService.createRoom(request);
		return created(response);
	}

	@Operation(summary = "코드로 방 입장", description = "코드로 방에 입장합니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "입장 성공", content = @Content),
		@ApiResponse(responseCode = "400", description = "잘못된 요청(파라미터 누락·형식 오류)", content = @Content),
		@ApiResponse(responseCode = "401", description = "인증 필요", content = @Content),
		@ApiResponse(responseCode = "403", description = "권한 없음", content = @Content),
		@ApiResponse(responseCode = "404", description = "방을 찾을 수 없음", content = @Content),
		@ApiResponse(responseCode = "409", description = "이미 다른 방에 참여 중이거나 생성한 방이 존재합니다.", content = @Content),
		@ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
	})
	@PostMapping("/join/code")
	public ResponseEntity<CommonResponse<Void>> joinRoomByCode(
		@Valid @RequestBody RoomJoinByCodeRequest request) {
		roomService.joinRoomByCode(request);
		return ok(null);
	}

	@Operation(summary = "비밀번호로 방 입장", description = "비밀번호로 방에 입장합니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "입장 성공", content = @Content),
		@ApiResponse(responseCode = "400", description = "잘못된 요청(파라미터 누락·형식 오류)", content = @Content),
		@ApiResponse(responseCode = "401", description = "인증 필요", content = @Content),
		@ApiResponse(responseCode = "403", description = "비밀번호 불일치 또는 권한 없음", content = @Content),
		@ApiResponse(responseCode = "404", description = "방을 찾을 수 없음", content = @Content),
		@ApiResponse(responseCode = "409", description = "이미 다른 방에 참여 중이거나 생성한 방이 존재합니다.", content = @Content),
		@ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
	})
	@PostMapping("/join/password")
	public ResponseEntity<CommonResponse<Void>> joinRoomByPassword(
		@Valid @RequestBody RoomJoinByPasswordRequest request) {
		roomService.joinRoomByPassword(request);
		return ok(null);
	}

	@Operation(summary = "방 목록 조회", description = "현재 생성된 모든 방 목록을 조회합니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "조회 성공",
			content = @Content(schema = @Schema(implementation = RoomsListResponse.class))),
		@ApiResponse(responseCode = "401", description = "인증 필요", content = @Content),
		@ApiResponse(responseCode = "403", description = "권한 없음", content = @Content),
		@ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
	})
	@GetMapping
	public ResponseEntity<CommonResponse<RoomsListResponse>> listRooms() {
		RoomsListResponse dto = roomService.getRoomsList();
		return ok(dto);
	}

	/** 방 참가자 조회 */
	@Operation(summary = "방 참가자 조회", description = "주어진 roomCode에 속한 참가자 목록을 조회합니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "조회 성공",
			content = @Content(schema = @Schema(implementation = ParticipantsListResponse.class))),
		@ApiResponse(responseCode = "400", description = "잘못된 요청", content = @Content),
		@ApiResponse(responseCode = "401", description = "인증 필요", content = @Content),
		@ApiResponse(responseCode = "403", description = "권한 없음", content = @Content),
		@ApiResponse(responseCode = "404", description = "방을 찾을 수 없음", content = @Content),
		@ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
	})
	@GetMapping("/{roomCode}/participants")
	public ResponseEntity<CommonResponse<ParticipantsListResponse>> getParticipants(
		@PathVariable
		@Pattern(regexp = "^[A-Za-z0-9]{6}$", message = "방 코드는 6자리 영문·숫자이어야 합니다.")
		String roomCode) {
		ParticipantsListResponse dto = roomService.getParticipants(roomCode);
		return ok(dto);
	}

	@Operation(summary = "방 검색", description = "roomName을 포함하는 방 목록을 조회합니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "검색 성공",
			content = @Content(schema = @Schema(implementation = RoomsSearchResponse.class))),
		@ApiResponse(responseCode = "400", description = "잘못된 요청(파라미터 누락·형식 오류)", content = @Content),
		@ApiResponse(responseCode = "401", description = "인증 필요", content = @Content),
		@ApiResponse(responseCode = "403", description = "권한 없음", content = @Content),
		@ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
	})
	@GetMapping(params = "roomName")
	public ResponseEntity<CommonResponse<RoomsSearchResponse>> searchRooms(
		@RequestParam
		@NotBlank(message = "검색어를 입력해주세요.")
		String roomName) {
		RoomsSearchResponse dto = roomService.searchRooms(roomName);
		return ok(dto);
	}

	@Operation(summary = "방 상세 조회", description = "roomCode에 해당하는 방 정보와 참가자 목록을 반환합니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "조회 성공",
			content = @Content(schema = @Schema(implementation = RoomDetailResponse.class))),
		@ApiResponse(responseCode = "401", description = "인증 필요", content = @Content),
		@ApiResponse(responseCode = "403", description = "권한 없음", content = @Content),
		@ApiResponse(responseCode = "404", description = "방을 찾을 수 없음", content = @Content),
		@ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
	})
	@GetMapping("/{roomCode}")
	public ResponseEntity<CommonResponse<RoomDetailResponse>> getRoomByCode(
		@PathVariable
		@Pattern(regexp = "^[A-Za-z0-9]{6}$", message = "방 코드는 6자리 영문·숫자이어야 합니다.")
		String roomCode) {
		RoomDetailResponse dto = roomService.getRoomDetail(roomCode);
		return ok(dto);
	}

	@DeleteMapping("/{roomCode}/out")
	public ResponseEntity<CommonResponse<Void>> leaveRoom(@PathVariable String roomCode) {
		roomService.leaveRoom(roomCode);
		return ok(null);
	}

	@PostMapping("/game/start")
	@Operation(summary = "게임 시작", description = "방 코드에 해당하는 방의 게임을 시작합니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "게임 시작 성공"),
		@ApiResponse(responseCode = "400", description = "잘못된 요청"),
		@ApiResponse(responseCode = "404", description = "방을 찾을 수 없음"),
		@ApiResponse(responseCode = "409", description = "이미 시작된 게임"),
		@ApiResponse(responseCode = "500", description = "서버 오류")
	})
	public ResponseEntity<CommonResponse<Void>> startGame(@Valid @RequestBody GameStartRequest request) {
		roomService.startGame(request.roomCode());
		return ok(null);
	}

	@PostMapping("/category")
	public ResponseEntity<CommonResponse<Void>> selectCategory(@RequestBody SelectCategoryRequest request) {
		roomService.selectCategory(request);
		return ok(null);
	}

	@PostMapping("/{roomCode}/ready")
	public ResponseEntity<CommonResponse<Void>> readyComplete(@PathVariable String roomCode) {
		roomService.gameReady(roomCode);
		return ok(null);
	}
}
