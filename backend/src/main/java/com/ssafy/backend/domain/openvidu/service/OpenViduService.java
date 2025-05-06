package com.ssafy.backend.domain.openvidu.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.concurrent.TimeUnit;

import com.ssafy.backend.domain.openvidu.dto.OpenViduTokenResponse;
import com.ssafy.backend.global.enums.ResponseCode;
import com.ssafy.backend.global.exception.CustomException;
import io.openvidu.java.client.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.core5.http.HttpResponse;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class OpenViduService {

	private final OpenVidu openVidu;
	private final RedissonClient redissonClient;

	@Value("${openvidu.url}")
	private String openviduUrl;

	@Value("${openvidu.secret}")
	private String openviduSecret;


	public OpenViduTokenResponse joinSession(String roomCode) {

		// roomCode별 Redis 분산 락 획득
		RLock lock = redissonClient.getLock("openvidu:lock:" + roomCode);

		try {
			// 최대 5초간 대기 락을 획득하면 최대 10초간 점유
			boolean isLocked = lock.tryLock(5, 10, TimeUnit.SECONDS);
			if (!isLocked) {
				log.warn("Redisson 락 획득 실패 - roomCode: {}", roomCode);
				throw new CustomException(ResponseCode.SESSION_CREATING);
			}

			// 해당 roomCode에 대한 세션 조회
			Session session = openVidu.getActiveSession(roomCode);
			boolean needNewSession = (session == null);

			// 세션 객체는 있지만, 실제 OpenVidu 서버에선 존재하지 않을 수 있음
			// 참가자가 모두 나가면 OpenVidu는 알아서 세션 정리
			// getActiveSession은 참가자가 모두 나간 경우에도 존재한다고 뜸
			if (!needNewSession && !sessionExists(session.getSessionId())) {
				needNewSession = true;
			}

			// 새 세션이 필요한 경우 생성
			if (needNewSession) {
				try {
					session = createNewSession(roomCode);
					log.info("새 세션 생성 완료 - roomCode: {}", roomCode);
				} catch (OpenViduJavaClientException | OpenViduHttpException e) {
					log.error("OpenVidu 세션 생성 실패 - roomCode: {}, error: {}", roomCode, e.getMessage(), e);
					throw new CustomException(ResponseCode.OPENVIDU_SESSION_ERROR);
				}
			}

			// 토큰 생성
			try {
				Connection connection = session.createConnection(
					new ConnectionProperties.Builder()
						.type(ConnectionType.WEBRTC)
						.role(OpenViduRole.PUBLISHER)
						.build()
				);

				return OpenViduTokenResponse.builder()
					.sessionId(session.getSessionId())
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

	// OpenVidu 세션 생성
	private Session createNewSession(String roomId)
		throws OpenViduJavaClientException, OpenViduHttpException {
		return openVidu.createSession(
			new SessionProperties.Builder()
				.customSessionId(roomId)
				.build()
		);
	}

	// openVidu.fetch() 메서드로 OpenVidu 내 세션이 존재하는지 확인가능 하지만 모든 세션 조회
	// REST API로 해당 sessionId에 대한 OpenVidu 세션 활성화 여부 판단
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
}
