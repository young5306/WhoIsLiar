package com.ssafy.backend.global.config;

import com.ssafy.backend.global.websocket.AuthHandshakeInterceptor;
import com.ssafy.backend.global.websocket.CustomWebSocketHandler;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

	private final AuthHandshakeInterceptor authHandshakeInterceptor;
	private final CustomWebSocketHandler customWebSocketHandler;

	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry.addHandler(customWebSocketHandler, "/ws")
			.addInterceptors(authHandshakeInterceptor)
			.setAllowedOrigins("*"); // 테스트할 땐 모두 허용
	}
}
