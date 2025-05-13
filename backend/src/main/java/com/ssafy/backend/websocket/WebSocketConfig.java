package com.ssafy.backend.websocket;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.socket.sockjs.transport.handler.WebSocketTransportHandler;
import org.springframework.web.socket.sockjs.transport.handler.XhrPollingTransportHandler;
import org.springframework.web.socket.sockjs.transport.handler.XhrStreamingTransportHandler;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	private final AuthHandshakeInterceptor authHandshakeInterceptor;
	private final BrokerInboundLoggingInterceptor brokerInboundLoggingInterceptor;
	private final BrokerOutboundLoggingInterceptor brokerOutboundLoggingInterceptor;
	private final AuthTokenChannelInterceptor authTokenChannelInterceptor;

	@Bean
	public ThreadPoolTaskScheduler stompHeartbeatScheduler() {
		ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
		scheduler.setPoolSize(1); // heartbeat는 1개면 충분
		scheduler.setThreadNamePrefix("wss-heartbeat-thread-");
		scheduler.initialize();
		return scheduler;
	}

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		DefaultHandshakeHandler handshakeHandler = new DefaultHandshakeHandler();
		registry.addEndpoint("/ws")
			.setAllowedOriginPatterns("*")
			.addInterceptors(authHandshakeInterceptor)
			.withSockJS()
			.setTransportHandlerOverrides(
				new WebSocketTransportHandler(handshakeHandler),
				new XhrStreamingTransportHandler(),
				new XhrPollingTransportHandler()
			);
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		// /topic으로 시작하는 주소로 브로커가 메시지를 보냄
		registry.enableSimpleBroker("/topic")
			.setHeartbeatValue(new long[]{10000, 10000})
			.setTaskScheduler(stompHeartbeatScheduler());
		// 클라이언트가 메시지를 보낼 때 /app으로 시작해야 컨트롤러로 들어옴
		registry.setApplicationDestinationPrefixes("/app");
	}

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		registration.interceptors(
			brokerInboundLoggingInterceptor,
			authTokenChannelInterceptor
		);
	}

	@Override
	public void configureClientOutboundChannel(ChannelRegistration registration) {
		registration.interceptors(
			brokerOutboundLoggingInterceptor
		);
	}
}
