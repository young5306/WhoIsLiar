package com.ssafy.backend.config;

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
import com.ssafy.backend.domain.auth.security.AuthTokenFilter;
import com.ssafy.backend.domain.auth.service.AuthService;
import com.ssafy.backend.global.common.CommonResponse;
import com.ssafy.backend.global.enums.ResponseCode;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
	private final AuthService authService;

	private final CorsProperties corsProps;

	public SecurityConfig(AuthService authService, CorsProperties corsProps)
	{
		this.authService = authService;
		this.corsProps = corsProps;
	}

	@Bean
	public AuthTokenFilter authTokenFilter() {
		return new AuthTokenFilter(authService);
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http,
		CorsConfigurationSource corsConfigurationSource, ObjectMapper objectMapper) throws Exception {
		http
			.cors(cors -> cors.configurationSource(corsConfigurationSource))
			.csrf(csrf -> csrf.disable())
			.sessionManagement(sess ->
				sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
			)
			.authorizeHttpRequests(auth -> auth
				.requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
				.requestMatchers("/ws/**").permitAll()
				.requestMatchers("/api/openvidu/**").permitAll()
				.requestMatchers("/actuator/**", "/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html", "/api/test2")
				.permitAll()
				.anyRequest().authenticated()
			)
			.addFilterBefore(authTokenFilter(),
				UsernamePasswordAuthenticationFilter.class)
			.exceptionHandling(ex -> ex
				.authenticationEntryPoint((req, res, authEx) -> {
					res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
					res.setCharacterEncoding("UTF-8");
					res.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
					String body = objectMapper.writeValueAsString(
						CommonResponse.failure(ResponseCode.UNAUTHORIZED)
					);
					res.getWriter().write(body);
				})
				.accessDeniedHandler((req, res, accessEx) -> {
					res.setStatus(HttpServletResponse.SC_FORBIDDEN);
					res.setCharacterEncoding("UTF-8");
					res.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
					String body = objectMapper.writeValueAsString(
						CommonResponse.failure(ResponseCode.FORBIDDEN)
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
		cfg.setAllowedOrigins(corsProps.getAllowedOrigins());
		cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
		cfg.setAllowCredentials(true);
		cfg.setAllowedHeaders(List.of("*"));

		var source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", cfg);
		return source;
	}
}
