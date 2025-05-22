package com.ssafy.backend.domain.room.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.room.entity.Room;

public interface RoomRepository extends JpaRepository<Room, Long> {
	boolean existsByRoomCode(String roomCode);

	Optional<Room> findByRoomCode(String roomCode);

	boolean existsBySession(SessionEntity session);

	List<Room> findByRoomNameContaining(String roomName);

	List<Room> findByRoomNameContaining(String roomName, Sort sort);

	@Query("SELECT r FROM Room r JOIN FETCH r.session WHERE r.roomCode = :roomCode")
	Optional<Room> findByRoomCodeFetchSession(@Param("roomCode") String roomCode);
}
