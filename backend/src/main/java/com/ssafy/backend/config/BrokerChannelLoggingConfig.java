package com.ssafy.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.SubscribableChannel;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.AbstractMessageChannel;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.support.MessageHeaderAccessor;

@Configuration
public class BrokerChannelLoggingConfig {

	private static final Logger logger = LoggerFactory.getLogger("brokerChannel");

	@Autowired
	public void configureBrokerChannel(@Qualifier("brokerChannel") SubscribableChannel brokerChannel) {
		((AbstractMessageChannel) brokerChannel).addInterceptor(new ChannelInterceptor() {
			@Override
			public Message<?> preSend(Message<?> message, MessageChannel channel) {
				StompHeaderAccessor sha = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
				if (sha != null && sha.getCommand() != null) {
					logger.info("[BROKER ▶] {} → {}", sha.getCommand(), message.getPayload());
				}
				return message;
			}
		});
	}
}
