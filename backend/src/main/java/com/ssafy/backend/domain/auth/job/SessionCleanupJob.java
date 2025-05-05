package com.ssafy.backend.domain.auth.job;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.auth.repository.SessionRepository;
import com.ssafy.backend.domain.participant.repository.ParticipantRepository;
import com.ssafy.backend.domain.room.repository.RoomRepository;

@Component
public class SessionCleanupJob {
	private static final Logger log = LoggerFactory.getLogger(SessionCleanupJob.class);

	private final SessionRepository sessionRepository;
	private final RoomRepository roomRepository;
	private final ParticipantRepository participantRepository;
	private final Duration sessionTimeout;

	public SessionCleanupJob(
		SessionRepository sessionRepository,
		RoomRepository roomRepository,
		ParticipantRepository participantRepository,
		@Value("${session.timeout.minutes:30}") long timeoutMin
	) {
		this.sessionRepository = sessionRepository;
		this.roomRepository = roomRepository;
		this.participantRepository = participantRepository;
		this.sessionTimeout = Duration.ofMinutes(timeoutMin);
	}

	@Scheduled(fixedDelay = 10 * 60 * 1000)
	@Transactional
	public void cleanupStaleSessions() {
		LocalDateTime cutoff = LocalDateTime.now().minus(sessionTimeout);
		List<SessionEntity> staleSessions = sessionRepository.findByLastActiveAtBefore(cutoff);
		for (SessionEntity s : staleSessions) {
			boolean isHost = roomRepository.existsBySession(s);
			boolean isParticipant = participantRepository.existsBySession(s);
			if (!isHost && !isParticipant) {
				sessionRepository.delete(s);
				log.info("Stale session deleted: {}", s.getId());
			}
		}
	}
}