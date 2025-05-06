package com.ssafy.backend.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

@Component
public class BrokerInboundLoggingInterceptor implements ChannelInterceptor {
	private static final Logger logger = LoggerFactory.getLogger(BrokerInboundLoggingInterceptor.class);

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
		if (accessor != null) {
			logger.info("[BROKER IN]  {} ▶ {}", accessor.getCommand(), message.getPayload());
		}
		return message;
	}
}
