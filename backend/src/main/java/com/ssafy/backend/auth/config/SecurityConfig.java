package com.ssafy.backend.auth.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.backend.auth.security.AuthTokenFilter;
import com.ssafy.backend.auth.service.AuthService;
import com.ssafy.backend.common.ApiResponse;
import com.ssafy.backend.common.ResponseCode;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
	private final AuthService authService;

	public SecurityConfig(AuthService authService) {
		this.authService = authService;
	}

	@Bean
	public AuthTokenFilter authTokenFilter() {
		return new AuthTokenFilter(authService);
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http,
		CorsConfigurationSource corsConfigurationSource, ObjectMapper objectMapper) throws Exception {
		http
			// 1) CORS 설정 — corsConfigurationSource 빈을 직접 지정
			.cors(cors -> cors.configurationSource(corsConfigurationSource))
			// 2) CSRF 비활성화
			.csrf(csrf -> csrf.disable())
			// 3) 세션 관리 STATLESS
			.sessionManagement(sess ->
				sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
			)
			// 4) 인증·인가 규칙
			.authorizeHttpRequests(auth -> auth
				// 1) 로그인, 닉네임 중복 검사는 누구나
				.requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
				.requestMatchers(HttpMethod.GET,  "/auth/check-nickname").permitAll()

				// 2) Swagger/UI, Actuator 등은 공개
				.requestMatchers("/actuator/**", "/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html")
				.permitAll()

				// 3) 그 외 모든 요청(= /auth/me, /auth/logout 포함)은 인증 필요
				.anyRequest().authenticated()
			)
			// 5) 토큰 필터 삽입 (UsernamePasswordAuthenticationFilter 앞)
			.addFilterBefore(authTokenFilter(),
				UsernamePasswordAuthenticationFilter.class)
			// 인증/인가 예외 처리
			.exceptionHandling(ex -> ex
				.authenticationEntryPoint((req, res, authEx) -> {
					res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
					res.setCharacterEncoding("UTF-8");
					res.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
					String body = objectMapper.writeValueAsString(
						ApiResponse.failure(ResponseCode.UNAUTHORIZED)
					);
					res.getWriter().write(body);
				})
				.accessDeniedHandler((req, res, accessEx) -> {
					res.setStatus(HttpServletResponse.SC_FORBIDDEN);
					res.setCharacterEncoding("UTF-8");
					res.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
					String body = objectMapper.writeValueAsString(
						ApiResponse.failure(ResponseCode.FORBIDDEN)
					);
					res.getWriter().write(body);
				})
			)
		;

		return http.build();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration cfg = new CorsConfiguration();
		cfg.setAllowedOrigins(List.of("http://localhost:5173","http://localhost:3000"));   // 프론트엔드 도메인
		cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
		cfg.setAllowCredentials(true);
		cfg.setAllowedHeaders(List.of("*"));

		var source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", cfg);
		return source;
	}
}
