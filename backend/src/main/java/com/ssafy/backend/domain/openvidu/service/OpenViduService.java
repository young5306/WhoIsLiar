package com.ssafy.backend.domain.openvidu.service;

import io.openvidu.java.client.*;
import lombok.RequiredArgsConstructor;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;



import io.openvidu.java.client.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

import com.ssafy.backend.domain.openvidu.dto.OpenViduTokenResponse;

@Service
@RequiredArgsConstructor
public class OpenViduService {

    private final OpenVidu openVidu;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String REDIS_PREFIX = "openvidu:session:";

    public OpenViduTokenResponse joinSession(String roomId, String nickname)
        throws OpenViduJavaClientException, OpenViduHttpException {

        String redisKey = REDIS_PREFIX + roomId;
        String sessionId = redisTemplate.opsForValue().get(redisKey);

        Session session;

        if (sessionId == null) {
            session = openVidu.createSession(
                new SessionProperties.Builder()
                    .customSessionId(roomId)
                    .build()
            );
            sessionId = session.getSessionId();
            redisTemplate.opsForValue().set(redisKey, sessionId, Duration.ofHours(2)); // TTL 설정
        } else {
            session = openVidu.getActiveSession(sessionId);
            if (session == null) {
                redisTemplate.delete(redisKey);
                throw new IllegalStateException("세션이 만료되었거나 존재하지 않습니다.");
            }
        }

        Connection connection = session.createConnection(
            new ConnectionProperties.Builder()
                .data(nickname)
                .type(ConnectionType.WEBRTC)
                .build()
        );

        return OpenViduTokenResponse.builder()
            .sessionId(session.getSessionId())
            .token(connection.getToken())
            .build();
    }
}
