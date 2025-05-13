package com.ssafy.backend.domain.round.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.domain.round.entity.Round;

import io.lettuce.core.dynamic.annotation.Param;
import jakarta.persistence.LockModeType;

public interface RoundRepository extends JpaRepository<Round, Long> {
	List<Round> findByRoom(Room room);
	Optional<Round> findByRoomAndRoundNumber(Room room, int roundNumber);

	Optional<Round> findTopByRoomOrderByRoundNumberDesc(Room room);

	// @Lock(LockModeType.PESSIMISTIC_WRITE)
	// @Query("""
    //   SELECT r
    //   FROM Round r
    //   JOIN FETCH r.room rm
    //   WHERE rm.roomCode = :roomCode
    //     AND r.roundNumber = :roundNumber
    // """)
	// Optional<Round> findByRoomCodeAndRoundNumberForUpdate(
	// 	@Param("roomCode") String roomCode,
	// 	@Param("roundNumber") int roundNumber
	// );
}
