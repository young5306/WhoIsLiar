package com.ssafy.backend.domain.round.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.domain.round.entity.Round;

public interface RoundRepository extends JpaRepository<Round, Long> {
	List<Round> findByRoom(Room room);

	Optional<Round> findByRoomAndRoundNumber(Room room, int roundNumber);

	Optional<Round> findTopByRoomOrderByRoundNumberDesc(Room room);

	@Modifying
	@Query("DELETE FROM Round r WHERE r.room = :room")
	void deleteByRoom(@Param("room") Room room);

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
