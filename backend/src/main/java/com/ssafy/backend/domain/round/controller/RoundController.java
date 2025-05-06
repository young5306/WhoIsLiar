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

import com.ssafy.backend.domain.round.dto.request.RoundSettingRequest;
import com.ssafy.backend.domain.round.dto.response.AssignRoleResponse;
import com.ssafy.backend.domain.round.dto.response.RoundWordResponse;
import com.ssafy.backend.domain.round.service.RoundService;
import com.ssafy.backend.global.common.CommonResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

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
}

