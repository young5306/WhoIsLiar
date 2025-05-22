package com.ssafy.backend.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import com.ssafy.backend.domain.auth.service.AuthService;

@Component
public class AuthTokenChannelInterceptor implements ChannelInterceptor {

	private final AuthService authService;

	@Autowired
	public AuthTokenChannelInterceptor(AuthService authService) {
		this.authService = authService;
	}

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
		if (accessor != null && accessor.getSessionAttributes() != null) {
			String token = (String)accessor.getSessionAttributes().get("token");
			if (token != null) {
				authService.validateAndRefresh(token);
			}
		}
		return message;
	}
}
