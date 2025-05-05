package com.ssafy.backend.domain.round.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.domain.round.entity.Round;

public interface RoundRepository extends JpaRepository<Round, Long> {
	List<Round> findByRoom(Room room);
}
