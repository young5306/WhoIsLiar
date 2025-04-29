package com.ssafy.backend.domain.auth.security;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.auth.service.AuthService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class AuthTokenFilter extends OncePerRequestFilter {

	private final AuthService authService;

	public AuthTokenFilter(AuthService authService) {
		this.authService = authService;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request,
		HttpServletResponse response,
		FilterChain filterChain)
		throws ServletException, IOException {
		// 1) 쿠키에서 토큰 꺼내기
		String token = Optional.ofNullable(request.getCookies())
			.flatMap(cookies ->
				List.of(cookies).stream()
					.filter(c -> "AUTH_TOKEN".equals(c.getName()))
					.map(Cookie::getValue)
					.findFirst()
			).orElse(null);

		// 2) 인증 정보가 없으면, 토큰 유효성 검사 & 갱신 시도
		if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
			try {
				SessionEntity session = authService.validateAndRefresh(token);
				// 3) SecurityContext 에 사용자 정보 등록
				var auth = new UsernamePasswordAuthenticationToken(
					session.getNickname(),
					null,
					List.of(new SimpleGrantedAuthority("ROLE_USER"))
				);
				auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
				SecurityContextHolder.getContext().setAuthentication(auth);
			} catch (Exception ex) {
				// 토큰 만료·비정상 시에는 그냥 인증안된 상태로 진행
			}
		}

		filterChain.doFilter(request, response);
	}
}
