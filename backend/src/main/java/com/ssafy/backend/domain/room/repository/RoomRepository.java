package com.ssafy.backend.domain.room.repository;

import com.ssafy.backend.domain.room.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {
	boolean existsByRoomCode(String roomCode);
}
