package com.ssafy.backend.domain.participant.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.participant.entity.Participant;
import com.ssafy.backend.domain.room.entity.Room;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {
	List<Participant> findByRoom(Room room);

	int countByRoom(Room room);

	boolean existsBySession(SessionEntity session);

	Optional<Participant> findByRoomAndSession(Room room, SessionEntity session);

	// 방에 실제로 존재하는 참가자 조회
	@Query("SELECT p FROM Participant p WHERE p.room = :room AND p.isActive = true")
	List<Participant> findByRoomAndActive(@Param("room") Room room);

	int countByRoomAndIsActiveTrue(Room room);

	List<Participant> findByRoomAndIsActiveTrueOrderByCreatedAtAsc(Room room);

	boolean existsBySessionAndIsActiveTrue(SessionEntity session);

	@Query("SELECT p FROM Participant p WHERE p.room = :room AND p.session = :session AND p.isActive = true")
	Optional<Participant> findByRoomAndSessionAndActive(Room room, SessionEntity session);

	@Query("SELECT p FROM Participant p WHERE p.session = :session AND p.isActive = true")
	Optional<Participant> findBySessionAndActive(SessionEntity session);

	@Query("SELECT p FROM Participant p WHERE p.room.roomCode = :roomCode AND p.session.nickname = :nickname")
	Optional<Participant> findByRoomCodeAndNickname(@Param("roomCode") String roomCode, @Param("nickname") String nickname);

	long countByRoom_RoomCodeAndReadyStatusTrue(String roomCode);

	List<Participant> findByRoomAndIsActiveFalse(Room room);
}
