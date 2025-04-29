package com.ssafy.backend.domain.room.service;

import static java.util.stream.Collectors.*;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.auth.repository.SessionRepository;
import com.ssafy.backend.domain.participant.entity.Participant;
import com.ssafy.backend.domain.participant.repository.ParticipantRepository;
import com.ssafy.backend.domain.room.dto.request.RoomCreateRequest;
import com.ssafy.backend.domain.room.dto.request.RoomJoinByCodeRequest;
import com.ssafy.backend.domain.room.dto.response.ParticipantInfo;
import com.ssafy.backend.domain.room.dto.response.RoomCreateResponse;
import com.ssafy.backend.domain.room.dto.response.RoomInfo;
import com.ssafy.backend.domain.room.dto.response.RoomJoinByCodeResponse;
import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.domain.room.repository.RoomRepository;
import com.ssafy.backend.global.enums.RoomStatus;
import com.ssafy.backend.global.util.SecurityUtils;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomService {

	private final RoomRepository roomRepository;
	private final SessionRepository sessionRepository;
	private final ParticipantRepository participantRepository;

	private static final int ROOM_CODE_LENGTH = 6;
	private static final String ROOM_CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	// 방 생성
	public RoomCreateResponse createRoom(RoomCreateRequest request) {
		String roomCode = generateUniqueRoomCode();
		SessionEntity session = sessionRepository.findByNickname(request.hostNickname())
			.orElseThrow(() -> new NoSuchElementException("세션 정보를 찾을 수 없습니다."));

		Room room = Room.builder()
			.session(session)
			.roomCode(roomCode)
			.roomName(request.roomName())
			.password(request.password())
			.roundCount(request.roundCount())
			.mode(request.mode())
			.roomStatus(RoomStatus.waiting)
			.createdAt(LocalDateTime.now())
			.updatedAt(LocalDateTime.now())
			.build();
		roomRepository.save(room);

		Participant participant = Participant.builder()
			.session(session)
			.room(room)
			.isActive(true)
			.createdAt(LocalDateTime.now())
			.updatedAt(LocalDateTime.now())
			.build();
		participantRepository.save(participant);

		RoomInfo roomInfo = RoomInfo.builder()
			.roomName(room.getRoomName())
			.roomCode(room.getRoomCode())
			.isSecret(room.getPassword() != null)
			.playerCount(1) // 생성자는 무조건 1명 (자기 자신)
			.roundCount(room.getRoundCount())
			.mode(room.getMode().name())
			.category(room.getCategory().name())
			.hostNickname(session.getNickname())
			.status(room.getRoomStatus().name())
			.build();

		return RoomCreateResponse.builder()
			.room(roomInfo)
			.build();
	}

	// roomCode 생성(6자리)
	private String generateUniqueRoomCode() {
		Random random = new Random();
		String roomCode;

		do {
			StringBuilder sb = new StringBuilder();
			for (int i = 0; i < ROOM_CODE_LENGTH; i++) {
				int index = random.nextInt(ROOM_CODE_CHARACTERS.length());
				sb.append(ROOM_CODE_CHARACTERS.charAt(index));
			}
			roomCode = sb.toString();
		} while (roomRepository.existsByRoomCode(roomCode));

		return roomCode;
	}

	// 코드로 방 입장
	public RoomJoinByCodeResponse joinRoomByCode(RoomJoinByCodeRequest request) {
		Room room = roomRepository.findByRoomCode(request.roomCode())
			.orElseThrow(() -> new NoSuchElementException("존재하지 않는 방입니다."));

		SessionEntity session = sessionRepository.findByNickname(SecurityUtils.getCurrentNickname())
			.orElseThrow(() -> new NoSuchElementException("세션 정보를 찾을 수 없습니다."));

		Participant participant = Participant.builder()
			.session(session)
			.room(room)
			.isActive(true)
			.createdAt(LocalDateTime.now())
			.updatedAt(LocalDateTime.now())
			.build();
		participantRepository.save(participant);

		List<Participant> participants = participantRepository.findByRoom(room);

		RoomInfo roomInfo = RoomInfo.builder()
			.roomName(room.getRoomName())
			.roomCode(room.getRoomCode())
			.isSecret(room.getPassword() != null)
			.playerCount(participants.size()) // 생성자는 무조건 1명 (자기 자신)
			.roundCount(room.getRoundCount())
			.mode(room.getMode().name())
			.category(room.getCategory().name())
			.hostNickname(SecurityUtils.getCurrentNickname())
			.status(room.getRoomStatus().name())
			.build();

		List<ParticipantInfo> participantInfos = participants.stream()
			.map(p -> new ParticipantInfo(
				p.getId(),
				p.getSession().getNickname(),
				p.isActive()
			))
			.collect(toList());

		return new RoomJoinByCodeResponse(roomInfo, participantInfos);
	}
}
