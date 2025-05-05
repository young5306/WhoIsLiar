package com.ssafy.backend.websocket;

import com.ssafy.backend.domain.auth.service.AuthService;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.*;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	private final AuthHandshakeInterceptor authHandshakeInterceptor;
	private final AuthService authService;

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

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		registration.interceptors(new ChannelInterceptor() {
			@Override
			public Message<?> preSend(Message<?> message, MessageChannel channel) {
				StompHeaderAccessor accessor =
					MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
				if (accessor == null) {
					return message;
				}

				String token = (String) accessor.getSessionAttributes().get("token");
				if (token != null) {
					authService.validateAndRefresh(token);
				}
				return message;
			}
		});
	}
}
