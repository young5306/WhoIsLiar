package com.ssafy.backend.domain.participant.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ssafy.backend.domain.participant.entity.ParticipantRound;
import com.ssafy.backend.domain.round.entity.Round;

public interface ParticipantRoundRepository extends JpaRepository<ParticipantRound, Long> {
	void deleteByRound(Round round);
}
