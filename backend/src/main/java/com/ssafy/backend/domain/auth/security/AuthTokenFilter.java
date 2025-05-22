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

		String token = Optional.ofNullable(request.getCookies())
			.flatMap(cookies ->
				List.of(cookies).stream()
					.filter(c -> "AUTH_TOKEN".equals(c.getName()))
					.map(Cookie::getValue)
					.findFirst()
			).orElse(null);

		if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
			try {
				SessionEntity session = authService.validateAndRefresh(token);

				var auth = new UsernamePasswordAuthenticationToken(
					session.getNickname(),
					null,
					List.of(new SimpleGrantedAuthority("ROLE_USER"))
				);
				auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
				SecurityContextHolder.getContext().setAuthentication(auth);
			} catch (Exception ex) {

			}
		}

		filterChain.doFilter(request, response);
	}
}
