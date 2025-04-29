package com.ssafy.backend.domain.auth.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import com.ssafy.backend.domain.auth.dto.LoginRequestDto;
import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.auth.repository.SessionRepository;
import com.ssafy.backend.global.exception.CustomException;
import com.ssafy.backend.global.common.ResponseCode;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

@Service
@Validated
public class AuthService {
	private static final Logger log = LoggerFactory.getLogger(AuthService.class);
	private final SessionRepository repo;
	private final Duration sessionTimeout;

	public AuthService(SessionRepository repo,
		@Value("${session.timeout.minutes:30}") long timeoutMin) {
		this.repo = repo;
		this.sessionTimeout = Duration.ofMinutes(timeoutMin);
	}

	/** 닉네임 중복 확인 */
	public boolean isNicknameAvailable(String nickname) {
		return repo.findByNickname(nickname).isEmpty();
	}

	/** 로그인: 토큰 발급 */
	@Transactional
	public String login(@Valid LoginRequestDto req) {
		if (!isNicknameAvailable(req.nickname())) {
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
		return token;
	}

	/** 토큰 검사 및 마지막 활동 시간 갱신 */
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
			log.info("토큰검증 성공: nickname={}, token={}", s.getNickname(), token);
			return s;
		} catch (CustomException ex) {
			log.warn("토큰검증 실패: token={}, 이유={}", token, ex.getResponseCode());
			throw ex;
		}
	}

	/** 로그아웃 (토큰이 있으면 삭제) */
	@Transactional
	public void logoutIfPresent(String token) {
		if (token != null) {
			repo.findByToken(token).ifPresent(s -> {
				repo.delete(s);
				log.info("로그아웃: nickname={}, token={}", s.getNickname(), token);
			});
		}
	}

	/** 스케줄러: 만료 세션 일괄 정리 (10분마다) */
	@Scheduled(fixedDelay = 10 * 60 * 1000)
	@Transactional
	public void cleanupStaleSessions() {
		LocalDateTime cutoff = LocalDateTime.now().minus(sessionTimeout);
		repo.deleteByLastActiveAtBefore(cutoff);
	}
}
