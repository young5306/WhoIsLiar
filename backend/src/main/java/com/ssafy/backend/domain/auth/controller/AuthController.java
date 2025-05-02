package com.ssafy.backend.domain.auth.controller;

import static com.ssafy.backend.global.common.ResponseUtil.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.backend.domain.auth.dto.LoginRequestDto;
import com.ssafy.backend.domain.auth.dto.LoginResponseDto;
import com.ssafy.backend.domain.auth.service.AuthService;
import com.ssafy.backend.global.common.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import java.util.Map;

@Tag(name = "Auth", description = "인증 관련 API")
@RestController
@RequestMapping("/auth")
public class AuthController {

	private final AuthService auth;

	@Value("${cookie.secure}")
	private boolean cookieSecure;

	@Value("${cookie.samesite}")
	private String sameSite;

	public AuthController(AuthService auth) {
		this.auth = auth;
	}

	/** 로그인 (닉네임만) */
	@Operation(summary = "로그인 및 닉네임 중복 검사",
		description = "닉네임이 사용 중이면 available=false, 사용 가능하면 세션 발급 및 available=true 반환")
	@ApiResponses({
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "로그인 성공",
			content = @Content(mediaType = "application/json",
				schema = @Schema(implementation = LoginResponseDto.class))),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "유효성 검사 실패",
			content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "닉네임 중복(이미 사용 중)",
			content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류",
			content = @Content)
	})
	@PostMapping("/login")
	public ResponseEntity<ApiResponse<LoginResponseDto>> login(@Parameter(description = "로그인 요청 정보", required = true) @Valid @RequestBody LoginRequestDto req,
		HttpServletResponse response) {

		String token = auth.login(req);
		ResponseCookie cookie = ResponseCookie.from("AUTH_TOKEN", token)
			.httpOnly(true)
			.secure(cookieSecure)
			.sameSite(sameSite)
			.path("/")
			.maxAge(7 * 24 * 60 * 60) // 7일
			.build();
		response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
		LoginResponseDto body = new LoginResponseDto(token, req.nickname());
		return ok(body);
	}

	/** 로그아웃 */
	@Operation(summary = "로그아웃", description = "현재 세션을 종료하고 토큰을 무효화합니다.")
	@ApiResponses({
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "로그아웃 성공",
			content = @Content(mediaType = "application/json")),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요",
			content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음",
			content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류",
			content = @Content)
	})
	@PostMapping("/logout")
	public ResponseEntity<ApiResponse<Void>> logout(
		@Parameter(description = "저장된 세션 토큰 (쿠키)")
		@CookieValue(name = "AUTH_TOKEN", required = false) String token,
		HttpServletResponse response) {
		auth.logoutIfPresent(token);
		ResponseCookie cookie = ResponseCookie.from("AUTH_TOKEN", "")
			.httpOnly(true)
			.path("/")
			.maxAge(0)
			.build();
		response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
		return ok(null);
	}
	@Operation(summary = "내 정보 조회", description = "인증된 사용자의 닉네임 정보를 반환합니다.")
	@ApiResponses({
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
			content = @Content(mediaType = "application/json",
				schema = @Schema(example = "{ 'nickname': 'user1' }"))),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요",
			content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음",
			content = @Content),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류",
			content = @Content)
	})
	@GetMapping("/me")
	public ResponseEntity<ApiResponse<Map<String,String>>> me(@Parameter(hidden = true) @AuthenticationPrincipal String nickname) {
		return ok(Map.of("nickname", nickname));
	}
}
