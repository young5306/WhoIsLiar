package com.ssafy.backend.domain.room.repository;

import java.util.List;
import java.util.Optional;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.room.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomRepository extends JpaRepository<Room, Long> {
	boolean existsByRoomCode(String roomCode);
	Optional<Room> findByRoomCode(String roomCode);
	boolean existsBySession(SessionEntity session);
	List<Room> findByRoomNameContaining(String roomName);

	@Query("SELECT r FROM Room r JOIN FETCH r.session WHERE r.roomCode = :roomCode")
	Optional<Room> findByRoomCodeFetchSession(@Param("roomCode") String roomCode);
}
