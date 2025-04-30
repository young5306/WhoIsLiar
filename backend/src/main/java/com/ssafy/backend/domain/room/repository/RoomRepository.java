package com.ssafy.backend.domain.room.repository;

import java.util.List;
import java.util.Optional;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.room.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {
	boolean existsByRoomCode(String roomCode);
	Optional<Room> findByRoomCode(String roomCode);
	boolean existsBySession(SessionEntity session);
	List<Room> findByRoomNameContaining(String roomName);
}
