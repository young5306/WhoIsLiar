package com.ssafy.backend.domain.openvidu.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.concurrent.TimeUnit;

import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.HttpResponse;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.backend.domain.auth.repository.SessionRepository;
import com.ssafy.backend.domain.openvidu.dto.OpenViduTokenResponse;
import com.ssafy.backend.global.enums.ResponseCode;
import com.ssafy.backend.global.exception.CustomException;
import com.ssafy.backend.global.util.SecurityUtils;

import io.openvidu.java.client.Connection;
import io.openvidu.java.client.ConnectionProperties;
import io.openvidu.java.client.ConnectionType;
import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import io.openvidu.java.client.OpenViduRole;
import io.openvidu.java.client.Session;
import io.openvidu.java.client.SessionProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class OpenViduService {

	private final OpenVidu openVidu;
	private final RedissonClient redissonClient;
	private final SessionRepository sessionRepository;

	@Value("${openvidu.url}")
	private String openviduUrl;

	@Value("${openvidu.secret}")
	private String openviduSecret;

	public OpenViduTokenResponse joinSession(String roomCode) {

		String nickname = sessionRepository.findByNickname(SecurityUtils.getCurrentNickname())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND))
			.getNickname();

		RLock lock = redissonClient.getLock("openvidu:lock:" + roomCode);

		try {
			boolean isLocked = lock.tryLock(5, 10, TimeUnit.SECONDS);
			if (!isLocked) {
				log.warn("Redisson 락 획득 실패 - roomCode: {}", roomCode);
				throw new CustomException(ResponseCode.SESSION_CREATING);
			}

			Session session = openVidu.getActiveSession(roomCode);
			boolean needNewSession = (session == null);

			/**
			 * 세션 객체는 있지만, 실제 OpenVidu 서버에선 존재하지 않을 수 있음
			 * 참가자가 모두 나가면 OpenVidu는 알아서 세션 정리
			 * getActiveSession은 참가자가 모두 나간 경우에도 존재한다고 뜸
			 */
			if (!needNewSession && !sessionExists(roomCode)) {
				needNewSession = true;
			}

			if (!needNewSession && isNicknameDuplicated(roomCode, nickname)) {
				throw new CustomException(ResponseCode.OPENVIDU_CONFLICT);
			}

			if (needNewSession) {
				try {
					session = createNewSession(roomCode);
					log.info("새 세션 생성 완료 - roomCode: {}", roomCode);
				} catch (OpenViduJavaClientException | OpenViduHttpException e) {
					log.error("OpenVidu 세션 생성 실패 - roomCode: {}, error: {}", roomCode, e.getMessage(), e);
					throw new CustomException(ResponseCode.OPENVIDU_SESSION_ERROR);
				}
			}

			try {
				Connection connection = session.createConnection(
					new ConnectionProperties.Builder()
						.type(ConnectionType.WEBRTC)
						.role(OpenViduRole.PUBLISHER)
						.build()
				);

				return OpenViduTokenResponse.builder()
					.sessionId(roomCode)
					.token(connection.getToken())
					.build();

			} catch (OpenViduJavaClientException | OpenViduHttpException e) {
				log.error("세션 토큰 생성 실패 - sessionId: {}, error: {}", session.getSessionId(), e.getMessage(), e);
				throw new CustomException(ResponseCode.OPENVIDU_SESSION_ERROR);
			}

		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			log.error("Redisson 락 인터럽트 - roomCode: {}", roomCode, e);
			throw new CustomException(ResponseCode.SERVER_ERROR);
		} finally {
			try {
				if (lock.isHeldByCurrentThread()) {
					lock.unlock();
				}
			} catch (Exception e) {
				log.error("Redisson 락 해제 실패 - roomCode: {}, error: {}", roomCode, e.getMessage(), e);
			}
		}
	}

	private Session createNewSession(String roomId)
		throws OpenViduJavaClientException, OpenViduHttpException {
		return openVidu.createSession(
			new SessionProperties.Builder()
				.customSessionId(roomId)
				.build()
		);
	}

	/**
	 * openVidu.fetch() 메서드로 OpenVidu 내 세션이 존재하는지 확인가능 하지만 모든 세션 조회
	 * REST API로 해당 sessionId에 대한 OpenVidu 세션 활성화 여부 판단
	 */
	private boolean sessionExists(String sessionId) {
		try {
			HttpClient client = HttpClientBuilder.create().build();
			HttpGet request = new HttpGet(openviduUrl + "/openvidu/api/sessions/" + sessionId);

			String basicAuth = Base64.getEncoder()
				.encodeToString(("OPENVIDUAPP:" + openviduSecret).getBytes(StandardCharsets.UTF_8));
			request.setHeader("Authorization", "Basic " + basicAuth);

			HttpResponse response = client.execute(request);
			return response.getCode() == 200;

		} catch (Exception e) {
			log.warn("세션 존재 여부 확인 중 예외 발생 - sessionId: {}, error: {}", sessionId, e.getMessage(), e);
			return false;
		}
	}

	private boolean isNicknameDuplicated(String sessionId, String nickname) {
		try (CloseableHttpClient client = HttpClients.createDefault()) {
			HttpGet request = new HttpGet(openviduUrl + "/openvidu/api/sessions/" + sessionId + "/connection");

			String basicAuth = Base64.getEncoder()
				.encodeToString(("OPENVIDUAPP:" + openviduSecret).getBytes(StandardCharsets.UTF_8));
			request.setHeader("Authorization", "Basic " + basicAuth);

			try (CloseableHttpResponse response = client.execute(request)) {
				String json = EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);
				JsonNode root = new ObjectMapper().readTree(json);
				JsonNode content = root.get("content");

				if (content != null && content.isArray()) {
					for (JsonNode conn : content) {
						String clientDataRaw = conn.get("clientData").asText();
						if (clientDataRaw != null) {
							String existingNickname = new ObjectMapper()
								.readTree(clientDataRaw).get("clientData").asText();
							if (nickname.equals(existingNickname)) {
								return true;
							}
						}
					}
				}
			}
		} catch (Exception e) {
			log.warn("중복 닉네임 확인 중 예외 발생 - sessionId: {}, error: {}", sessionId, e.getMessage(), e);
		}
		return false;
	}

}