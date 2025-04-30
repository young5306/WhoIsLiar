package com.ssafy.backend.domain.openvidu.service;

import io.openvidu.java.client.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class OpenViduService {

    private final OpenVidu openVidu;


    public String createSession(String customSessionId) throws OpenViduJavaClientException, OpenViduHttpException {
        SessionProperties properties = new SessionProperties.Builder()
                .customSessionId(customSessionId)
                .mediaMode(MediaMode.ROUTED)
                .recordingMode(RecordingMode.MANUAL)
                .build();

        Session session = openVidu.createSession(properties);
        return session.getSessionId();
    }


    public String createToken(String sessionId, String clientData) throws OpenViduJavaClientException, OpenViduHttpException {
        Session session = openVidu.getActiveSession(sessionId);
        if (session == null) {
            throw new IllegalArgumentException("세션이 존재하지 않습니다: " + sessionId);
        }

        ConnectionProperties connectionProperties = new ConnectionProperties.Builder()
                .type(ConnectionType.WEBRTC)
                .role(OpenViduRole.PUBLISHER)
                .data(clientData)
                .build();

        Connection connection = session.createConnection(connectionProperties);
        return connection.getToken();
    }
}