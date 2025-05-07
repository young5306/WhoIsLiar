package com.ssafy.backend.domain.auth.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import com.ssafy.backend.domain.auth.dto.LoginRequestDto;
import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.auth.repository.SessionRepository;
import com.ssafy.backend.domain.participant.repository.ParticipantRepository;
import com.ssafy.backend.domain.room.repository.RoomRepository;
import com.ssafy.backend.global.exception.CustomException;
import com.ssafy.backend.global.enums.ResponseCode;
import com.ssafy.backend.global.util.SecurityUtils;

import io.micrometer.core.instrument.Counter;
import jakarta.validation.Valid;

@Service
@Validated
public class AuthService {
	private static final Logger log = LoggerFactory.getLogger(AuthService.class);
	private final SessionRepository repo;
	private final Duration sessionTimeout;

	private final Counter loginSuccess;
	private final Counter loginFailure;
	private final Counter tokenFail;
	private final RoomRepository roomRepository;
	private final ParticipantRepository participantRepository;

	public AuthService(SessionRepository repo,
		@Value("${session.timeout.minutes:30}") long timeoutMin,
		Counter authSuccessCounter,
		Counter authFailureCounter,
		Counter tokenValidationFailureCounter, RoomRepository roomRepository,
		ParticipantRepository participantRepository) {
		this.repo = repo;
		this.sessionTimeout = Duration.ofMinutes(timeoutMin);
		this.loginSuccess = authSuccessCounter;
		this.loginFailure = authFailureCounter;
		this.tokenFail    = tokenValidationFailureCounter;
		this.roomRepository = roomRepository;
		this.participantRepository = participantRepository;
	}

	@Transactional(readOnly = true)
	public boolean isNicknameAvailable(String nickname) {
		return repo.findByNickname(nickname).isEmpty();
	}

	@Transactional
	public String login(@Valid LoginRequestDto req) {
		if (!isNicknameAvailable(req.nickname())) {
			loginFailure.increment();
			log.warn("로그인 실패: 닉네임 중복 [{}]", req.nickname());
			throw new CustomException(ResponseCode.CONFLICT);
		}
		String token = UUID.randomUUID().toString();
		LocalDateTime now = LocalDateTime.now();
		SessionEntity s = new SessionEntity();
		s.setToken(token);
		s.setNickname(req.nickname());
		s.setCreatedAt(now);
		s.setLastActiveAt(now);
		repo.save(s);
		log.info("로그인 성공: nickname={}, token={}", req.nickname(), token);
		loginSuccess.increment();
		return token;
	}

	@Transactional
	public SessionEntity validateAndRefresh(String token) {
		try {
			SessionEntity s = repo.findByToken(token)
				.orElseThrow(() -> new CustomException(ResponseCode.UNAUTHORIZED));
			// 타임아웃 검사
			if (s.getLastActiveAt().plus(sessionTimeout).isBefore(LocalDateTime.now())) {
				repo.delete(s);
				log.warn("토큰만료: token={}", token);
				throw new CustomException(ResponseCode.UNAUTHORIZED);
			}
			s.setLastActiveAt(LocalDateTime.now());
			// log.info("토큰검증 성공: nickname={}, token={}", s.getNickname(), token);
			return s;
		} catch (CustomException ex) {
			log.warn("토큰검증 실패: token={}, 이유={}", token, ex.getResponseCode());
			tokenFail.increment();
			throw ex;
		}
	}

	@Transactional
	public void logoutIfPresent(String token) {
		System.out.println(SecurityUtils.getCurrentNickname());
		if (token != null) {
			repo.findByToken(token).ifPresent(s -> {
				repo.delete(s);
				log.info("로그아웃: nickname={}, token={}", s.getNickname(), token);
			});
		}
	}
}
