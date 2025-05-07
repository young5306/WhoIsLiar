package com.ssafy.backend.domain.round.controller;

import static com.ssafy.backend.global.common.ResponseUtil.*;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.backend.domain.round.dto.request.RoundStartRequest;
import com.ssafy.backend.domain.round.dto.request.VoteRequestDto;
import com.ssafy.backend.domain.round.dto.response.PlayerRoundInfoResponse;
import com.ssafy.backend.domain.round.dto.request.RoundSettingRequest;
import com.ssafy.backend.domain.round.dto.response.VoteResponseDto;
import com.ssafy.backend.domain.round.service.RoundService;
import com.ssafy.backend.global.common.CommonResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

@Tag(name = "Round", description = "라운드 관련 API")
@RestController
@RequestMapping("/rounds")
@Validated
public class RoundController {

	private final RoundService roundService;

	public RoundController(RoundService roundService) {
		this.roundService = roundService;
	}

	@Operation(summary = "게임 종료", description = "해당 방 코드에 대한 게임 데이터를 전부 삭제합니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "게임 종료 및 데이터 삭제 완료"),
		@ApiResponse(responseCode = "404", description = "방을 찾을 수 없습니다."),
		@ApiResponse(responseCode = "500", description = "서버 오류")
	})
	@DeleteMapping("/{roomCode}/end")
	public ResponseEntity<CommonResponse<Void>> endGame(@PathVariable String roomCode) {
		roundService.deleteGame(roomCode);
		return ok(null);
	}

	@Operation(summary = "라운드 세팅", description = "방의 게임 모드·카테고리 설정 후 라운드 및 참가자-라운드 데이터를 생성합니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "요청 성공"),
		@ApiResponse(responseCode = "400", description = "잘못된 요청(파라미터 오류)", content = @Content),
		@ApiResponse(responseCode = "401", description = "인증 필요", content = @Content),
		@ApiResponse(responseCode = "403", description = "권한 없음", content = @Content),
		@ApiResponse(responseCode = "404", description = "방을 찾을 수 없음", content = @Content),
		@ApiResponse(responseCode = "409", description = "생성 충돌(참가자 없음 등)", content = @Content),
		@ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
	})
	@PostMapping("/setting")
	public ResponseEntity<CommonResponse<Void>> settingRound(
		@Valid @RequestBody RoundSettingRequest request) {
		roundService.settingRound(request);
		return ok(null);
	}

	@Operation(
		summary = "모든 참가자 순서 및 나의 단어 조회",
		description = "해당 라운드의 전 참가자 순서 목록과 나에게 할당된 단어를 반환합니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "조회 성공",
			content = @Content(schema = @Schema(implementation = PlayerRoundInfoResponse.class))),
		@ApiResponse(responseCode = "401", description = "인증 필요"),
		@ApiResponse(responseCode = "403", description = "방 참가자 아님"),
		@ApiResponse(responseCode = "404", description = "방 또는 라운드 없음")
	})
	@GetMapping("/{roomCode}/{roundNumber}/player-info")
	public ResponseEntity<CommonResponse<PlayerRoundInfoResponse>> getPlayerRoundInfo(
		@Parameter(description = "방 코드", required = true)
		@PathVariable
		@Pattern(regexp = "^[A-Za-z0-9]{6}$", message = "방 코드는 6자리 영문·숫자이어야 합니다.")
		String roomCode,

		@Parameter(description = "라운드 번호", required = true, example = "1")
		@PathVariable
		@Min(value = 1, message = "라운드 번호는 1 이상이어야 합니다.")
		int roundNumber
	) {
		PlayerRoundInfoResponse dto = roundService.getPlayerRoundSetup(roomCode, roundNumber);
		return ok(dto);
	}

	@Operation(
		summary = "라운드 토론 시작",
		description = "해당 라운드의 상태를 DISCUSSION 으로 변경합니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "상태 변경 성공"),
		@ApiResponse(responseCode = "400", description = "잘못된 요청(파라미터 유효성 오류)", content = @Content),
		@ApiResponse(responseCode = "401", description = "인증 필요", content = @Content),
		@ApiResponse(responseCode = "404", description = "방 또는 라운드를 찾을 수 없음", content = @Content),
		@ApiResponse(responseCode = "409", description = "이미 토론 중이거나 상태 변경 불가", content = @Content),
		@ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
	})
	@PostMapping("/start")
	public ResponseEntity<CommonResponse<Void>> startDiscussion(
		@Valid @RequestBody RoundStartRequest request
	) {
		roundService.startRound(request);
		return ok(null);
	}

	@Operation(summary = "투표 제출", description = "해당 라운드에 대한 투표를 제출합니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "투표가 성공적으로 제출되었습니다."),
		@ApiResponse(responseCode = "400", description = "잘못된 요청"),
		@ApiResponse(responseCode = "401", description = "인증 필요"),
		@ApiResponse(responseCode = "403", description = "권한 없음"),
		@ApiResponse(responseCode = "404", description = "리소스를 찾을 수 없음")
	})
	@PostMapping("/{roomCode}/{roundNumber}/votes")
	public ResponseEntity<CommonResponse<VoteResponseDto>> vote(
		@PathVariable
		@Pattern(regexp = "^[A-Za-z0-9]{6}$", message = "방 코드는 6자리 영문·숫자이어야 합니다.")
		String roomCode,

		@PathVariable
		@Min(value = 1, message = "라운드 번호는 1 이상이어야 합니다.")
		int roundNumber,

		@Valid @RequestBody VoteRequestDto request
	) {
		VoteResponseDto dto = roundService.vote(roomCode, roundNumber, request);
		return ok(dto);
	}
}

