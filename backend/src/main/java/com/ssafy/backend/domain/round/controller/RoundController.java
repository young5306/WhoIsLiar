package com.ssafy.backend.domain.round.controller;

import static com.ssafy.backend.global.common.ResponseUtil.*;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.backend.domain.round.dto.request.AssignRoleRequest;
import com.ssafy.backend.domain.round.dto.response.AssignRoleResponse;
import com.ssafy.backend.domain.round.service.RoundService;
import com.ssafy.backend.global.common.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
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
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "요청 성공",
			content = @Content(mediaType = "application/json",
				schema = @Schema(implementation = AssignRoleResponse.class))),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "유효성 검사 실패", content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증이 필요합니다.", content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한이 없습니다.", content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "방 또는 참가자를 찾을 수 없습니다.", content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
	})
	@PostMapping("/assign/role")
	public ResponseEntity<ApiResponse<AssignRoleResponse>> assignRole(
		@RequestBody(description = "라운드 역할 할당 요청 정보", required = true,
			content = @Content(schema = @Schema(implementation = AssignRoleRequest.class)))
		@Valid @org.springframework.web.bind.annotation.RequestBody AssignRoleRequest request) {

		AssignRoleResponse response = roundService.assignRole(request);
		return ok(response);
	}
}

