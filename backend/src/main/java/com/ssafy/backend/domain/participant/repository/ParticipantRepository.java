package com.ssafy.backend.domain.participant.repository;

import com.ssafy.backend.domain.participant.entity.Participant;
import com.ssafy.backend.domain.room.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {
	List<Participant> findByRoom(Room room);
}
