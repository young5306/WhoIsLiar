package com.ssafy.backend.domain.round.controller;

import static com.ssafy.backend.global.common.ResponseUtil.*;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.backend.domain.round.dto.request.AssignRoleRequest;
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

	@Operation(
		summary = "라운드 역할 할당",
		description = "주어진 방 코드와 라운드 번호에 대해 라이어를 랜덤으로 할당합니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "요청 성공",
			content = @Content(mediaType = "application/json",
				schema = @Schema(implementation = AssignRoleResponse.class))),
		@ApiResponse(responseCode = "400", description = "유효성 검사 실패", content = @Content),
		@ApiResponse(responseCode = "401", description = "인증이 필요합니다.", content = @Content),
		@ApiResponse(responseCode = "403", description = "권한이 없습니다.", content = @Content),
		@ApiResponse(responseCode = "404", description = "방 또는 참가자를 찾을 수 없습니다.", content = @Content),
		@ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
	})
	@PostMapping("/assign/role")
	public ResponseEntity<CommonResponse<AssignRoleResponse>> assignRole(
		@RequestBody(description = "라운드 역할 할당 요청 정보", required = true,
			content = @Content(schema = @Schema(implementation = AssignRoleRequest.class)))
		@Valid @org.springframework.web.bind.annotation.RequestBody AssignRoleRequest request) {

		AssignRoleResponse response = roundService.assignRole(request);
		return ok(response);
	}


	@Operation(summary = "라운드 단어 조회", description = "라운드 ID에 따라 단어를 반환합니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "조회 성공",
			content = @Content(schema = @Schema(implementation = RoundWordResponse.class))),
		@ApiResponse(responseCode = "400", description = "잘못된 요청",
			content = @Content),
		@ApiResponse(responseCode = "401", description = "인증 필요",
			content = @Content),
		@ApiResponse(responseCode = "403", description = "권한 없음",
			content = @Content),
		@ApiResponse(responseCode = "404", description = "리소스를 찾을 수 없습니다.",
			content = @Content),
		@ApiResponse(responseCode = "500", description = "서버 오류",
			content = @Content)
	})
	@GetMapping("/{roundId}/word")
	public ResponseEntity<CommonResponse<RoundWordResponse>> getWord(@PathVariable Long roundId) {
		RoundWordResponse res = roundService.getRoundWord(roundId);
		return ok(res);
	}
}

