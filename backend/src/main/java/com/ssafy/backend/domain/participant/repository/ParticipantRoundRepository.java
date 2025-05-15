package com.ssafy.backend.domain.participant.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ssafy.backend.domain.participant.entity.Participant;
import com.ssafy.backend.domain.participant.entity.ParticipantRound;
import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.domain.round.entity.Round;

public interface ParticipantRoundRepository extends JpaRepository<ParticipantRound, Long> {
	void deleteByRound(Round round);

	List<ParticipantRound> findByRound(Round round);

	Optional<ParticipantRound> findByRoundAndParticipant(Round round, Participant participant);

	@Query("""
			SELECT pr
			FROM ParticipantRound pr
			JOIN FETCH pr.participant p
			JOIN FETCH p.session s
			WHERE pr.round = :round
			ORDER BY pr.order ASC
		""")
	List<ParticipantRound> findByRoundWithParticipantSession(@Param("round") Round round);

	@Modifying
	@Query("UPDATE ParticipantRound pr SET pr.hasVoted = false WHERE pr.round = :round")
	void resetHasVotedByRound(@Param("round") Round round);

	long countByRound(Round round);

	long countByRoundAndHasVotedTrue(Round round);

	long countByRoundAndParticipantIsActiveTrue(Round round);

	long countByRoundAndHasVotedTrueAndParticipantIsActiveTrue(Round round);

	@Modifying
	@Query("DELETE FROM ParticipantRound pr WHERE pr.round.room = :room")
	void deleteByRoom(@Param("room") Room room);
}
