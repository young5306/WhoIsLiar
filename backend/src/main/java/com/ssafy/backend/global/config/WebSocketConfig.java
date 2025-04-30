package com.ssafy.backend.global.config;

import com.ssafy.backend.global.websocket.AuthHandshakeInterceptor;
import com.ssafy.backend.global.websocket.CustomWebSocketHandler;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	private final AuthHandshakeInterceptor authHandshakeInterceptor;

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/ws")
			.setAllowedOriginPatterns("*")
			.addInterceptors(authHandshakeInterceptor)
			.withSockJS(); // SockJS fallback 사용
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		// /topic으로 시작하는 주소로 브로커가 메시지를 보냄
		registry.enableSimpleBroker("/topic");
		// 클라이언트가 메시지를 보낼 때 /app으로 시작해야 컨트롤러로 들어옴
		registry.setApplicationDestinationPrefixes("/app");
	}
}
