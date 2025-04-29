package com.ssafy.backend.domain.openvidu.service;

import io.openvidu.java.client.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class OpenViduService {

    private final OpenVidu openVidu;


    public String createSession(String customSessionId) throws OpenViduJavaClientException, OpenViduHttpException {
        // 세션 설정
        SessionProperties properties = new SessionProperties.Builder()
                .customSessionId(customSessionId) // optional, null 가능
                .mediaMode(MediaMode.ROUTED)      // ROUTED(기본) 또는 RELAY
                .recordingMode(RecordingMode.MANUAL) // 녹화 설정
                .build();

        // 세션 생성
        Session session = openVidu.createSession(properties);
        return session.getSessionId();
    }


    public String createToken(String sessionId, String clientData) throws OpenViduJavaClientException, OpenViduHttpException {
        Session session = openVidu.getActiveSession(sessionId);
        if (session == null) {
            throw new IllegalArgumentException("세션이 존재하지 않습니다: " + sessionId);
        }

        // 연결 속성 설정
        ConnectionProperties connectionProperties = new ConnectionProperties.Builder()
                .type(ConnectionType.WEBRTC)
                .role(OpenViduRole.PUBLISHER)
                .data(clientData)
                .build();

        Connection connection = session.createConnection(connectionProperties);
        return connection.getToken();
    }
}