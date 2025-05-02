package com.ssafy.backend.domain.auth.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ssafy.backend.domain.auth.entity.SessionEntity;

public interface SessionRepository extends JpaRepository<SessionEntity, Long> {
	Optional<SessionEntity> findByNickname(String nickname);
	Optional<SessionEntity> findByToken(String token);
	boolean existsByToken(String token);
	List<SessionEntity> findByLastActiveAtBefore(LocalDateTime cutoff);
}
