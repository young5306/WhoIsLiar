package com.ssafy.backend.domain.participant.repository;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.participant.entity.Participant;
import com.ssafy.backend.domain.room.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {
	List<Participant> findByRoom(Room room);
	int countByRoom(Room room);
	boolean existsBySession(SessionEntity session);
	Optional<Participant> findByRoomAndSession(Room room, SessionEntity session);
}
