package com.ssafy.backend.domain.openvidu.service;

import com.ssafy.backend.domain.openvidu.dto.OpenViduTokenResponse;
import io.openvidu.java.client.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

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
            // Redis에 없으면 세션 새로 생성
            session = openVidu.createSession(
                new SessionProperties.Builder()
                    .customSessionId(roomId)
                    .build()
            );
            sessionId = session.getSessionId();
            redisTemplate.opsForValue().set(redisKey, sessionId, Duration.ofHours(2));
        } else {
            // Redis에는 있지만 OpenVidu에 세션이 없으면 제거 후 재생성
            session = openVidu.getActiveSession(sessionId);
            if (session == null) {
                //  OpenVidu에서 세션이 만료된 상태
                redisTemplate.delete(redisKey); //  Redis 삭제

                // 새 세션 생성 및 Redis 갱신
                session = openVidu.createSession(
                    new SessionProperties.Builder()
                        .customSessionId(roomId)
                        .build()
                );
                sessionId = session.getSessionId();
                redisTemplate.opsForValue().set(redisKey, sessionId, Duration.ofHours(2));
            }
        }

        // 세션에 참가자 토큰 발급
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
