package com.ssafy.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;

@Configuration
public class MetricsConfig {

	@Bean
	public Counter authSuccessCounter(MeterRegistry registry) {
		return Counter.builder("auth.login.success")
			.description("로그인 성공 횟수")
			.register(registry);
	}

	@Bean
	public Counter authFailureCounter(MeterRegistry registry) {
		return Counter.builder("auth.login.failure")
			.description("로그인 실패 횟수")
			.register(registry);
	}

	@Bean
	public Counter tokenValidationFailureCounter(MeterRegistry registry) {
		return Counter.builder("auth.token.validation.failure")
			.description("토큰 검증 실패 횟수")
			.register(registry);
	}
}
