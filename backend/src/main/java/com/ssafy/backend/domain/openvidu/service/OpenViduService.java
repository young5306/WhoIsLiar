package com.ssafy.backend.domain.openvidu.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import com.ssafy.backend.domain.openvidu.dto.OpenViduTokenResponse;

import io.openvidu.java.client.*;
import lombok.RequiredArgsConstructor;

import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.core5.http.HttpResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OpenViduService {

	private final OpenVidu openVidu;

	@Value("${openvidu.url}")
	private String openviduUrl;

	@Value("${openvidu.secret}")
	private String openviduSecret;

	public OpenViduTokenResponse joinSession(String roomId, String nickname)
		throws OpenViduJavaClientException, OpenViduHttpException {
		// roomId를 가지고 오픈비두 세션을 가져옴
		Session session = openVidu.getActiveSession(roomId);

		// 오픈비두 세션이 없었을 때 처음으로 세션을 만드는 경우
		if (session == null) {
			session = createNewSession(roomId);
		}

		// 오픈비드 세션은 있지만 세션이 만료된 경우
		if (session != null && !sessionExists(session.getSessionId())) {
			session = createNewSession(roomId);
		}

		Connection connection = session.createConnection(
			new ConnectionProperties.Builder()
				.type(ConnectionType.WEBRTC)
				.data(nickname)
				.build()
		);

		return OpenViduTokenResponse.builder()
			.sessionId(session.getSessionId())
			.token(connection.getToken())
			.build();
	}

	private Session createNewSession(String roomId)
		throws OpenViduJavaClientException, OpenViduHttpException {
		return openVidu.createSession(
			new SessionProperties.Builder()
				.customSessionId(roomId)
				.build()
		);
	}

	// fetch를 통해서 가져오는 경우 JSON 형식과 관련해서 오류남 직접 HTTP 메서드 보내서 오픈비두 세션 활성화 여부 판단
	private boolean sessionExists(String sessionId) {
		try {
			HttpClient client = HttpClientBuilder.create().build();
			HttpGet request = new HttpGet(openviduUrl + "/openvidu/api/sessions/" + sessionId);

			String basicAuth = Base64.getEncoder()
				.encodeToString(("OPENVIDUAPP:" + openviduSecret).getBytes(StandardCharsets.UTF_8));
			request.setHeader("Authorization", "Basic " + basicAuth);

			HttpResponse response = client.execute(request);
			return response.getCode() == 200;

		} catch (IOException e) {
			return false;
		}
	}
}



