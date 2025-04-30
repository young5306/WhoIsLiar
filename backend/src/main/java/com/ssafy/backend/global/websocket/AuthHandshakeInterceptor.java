package com.ssafy.backend.global.websocket;

import com.ssafy.backend.domain.auth.repository.SessionRepository;
import com.ssafy.backend.global.util.SecurityUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthHandshakeInterceptor implements HandshakeInterceptor {

	private final SessionRepository sessionRepository;

	@Override
	public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
		WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {

		if (!(request instanceof ServletServerHttpRequest servletRequest)) {
			log.warn("Not a HttpServletRequest");
			return false;
		}

		// 쿠키 속 토큰 확인
		HttpServletRequest httpRequest = servletRequest.getServletRequest();
		Cookie[] cookies = httpRequest.getCookies();

		if (cookies == null) {
			log.warn("No cookies found");
			return false;
		}

		String AUTH_TOKEN = null;
		for (Cookie cookie : cookies) {
			if ("AUTH_TOKEN".equals(cookie.getName())) {
				AUTH_TOKEN = cookie.getValue();
				break;
			}
		}

		if (AUTH_TOKEN == null || AUTH_TOKEN.isEmpty()) {
			log.warn("Token not found in cookies");
			return false;
		}

		boolean exists = sessionRepository.existsByToken(AUTH_TOKEN);
		if (!exists) {
			log.warn("Invalid token: {}", AUTH_TOKEN);
			return false;
		}

		// 쿼리 스트링에서 roomCode 파라미터 읽기
		String roomCode = null;
		String query = request.getURI().getQuery(); // 예: token=xxx&roomCode=asdf1234
		if (query != null) {
			for (String param : query.split("&")) {
				String[] keyValue = param.split("=");
				if (keyValue.length == 2 && "roomCode".equals(keyValue[0])) {
					roomCode = keyValue[1];
					break;
				}
			}
		}

		if (roomCode == null || roomCode.isEmpty()) {
			log.warn("Room code not found in query params");
			return false;
		}

		log.info("Handshake successful - token: {}, roomCode: {}", AUTH_TOKEN, roomCode);

		attributes.put("token", AUTH_TOKEN);
		attributes.put("roomCode", roomCode);
		attributes.put("nickname", SecurityUtils.getCurrentNickname());

		return true;
	}

	@Override
	public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
		WebSocketHandler wsHandler, Exception ex) {
		// 필요시 사용
	}
}

