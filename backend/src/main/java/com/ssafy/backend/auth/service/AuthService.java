package com.ssafy.backend.auth.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import com.ssafy.backend.auth.dto.LoginRequestDto;
import com.ssafy.backend.auth.entity.SessionEntity;
import com.ssafy.backend.auth.repository.SessionRepository;
import com.ssafy.backend.common.CustomException;
import com.ssafy.backend.common.ResponseCode;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

@Service
@Validated
public class AuthService {
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
		return token;
	}

	/** 토큰 검사 및 마지막 활동 시간 갱신 */
	@Transactional
	public SessionEntity validateAndRefresh(String token) {
		SessionEntity s = repo.findByToken(token)
			.orElseThrow(() -> new CustomException(ResponseCode.UNAUTHORIZED));
		// 타임아웃 체크
		if (s.getLastActiveAt().plus(sessionTimeout).isBefore(LocalDateTime.now())) {
			repo.delete(s);
			throw new CustomException(ResponseCode.UNAUTHORIZED);
		}
		s.setLastActiveAt(LocalDateTime.now());
		return s;
	}

	/** 로그아웃 (토큰이 있으면 삭제) */
	@Transactional
	public void logoutIfPresent(String token) {
		if (token != null) {
			repo.findByToken(token).ifPresent(repo::delete);
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
