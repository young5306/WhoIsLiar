package com.ssafy.backend.domain.participant.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ssafy.backend.domain.participant.entity.ParticipantRound;
import com.ssafy.backend.domain.round.entity.Round;

public interface ParticipantRoundRepository extends JpaRepository<ParticipantRound, Long> {
	void deleteByRound(Round round);
	List<ParticipantRound> findByRound(Round round);
	Optional<ParticipantRound> findByRoundAndParticipant_Id(Round round, Long participantId);
}
