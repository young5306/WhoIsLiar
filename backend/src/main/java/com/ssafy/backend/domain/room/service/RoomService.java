package com.ssafy.backend.domain.room.service;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.auth.repository.SessionRepository;
import com.ssafy.backend.domain.room.entity.Participant;
import com.ssafy.backend.domain.room.repository.ParticipantRepository;
import com.ssafy.backend.domain.room.dto.request.RoomCreateRequest;
import com.ssafy.backend.domain.room.dto.request.RoomJoinByCodeRequest;
import com.ssafy.backend.domain.room.dto.request.RoomJoinByPasswordRequest;
import com.ssafy.backend.domain.room.dto.response.ParticipantInfo;
import com.ssafy.backend.domain.room.dto.response.ParticipantsListResponse;
import com.ssafy.backend.domain.room.dto.response.RoomCreateResponse;
import com.ssafy.backend.domain.room.dto.response.RoomDetailResponse;
import com.ssafy.backend.domain.room.dto.response.RoomInfo;
import com.ssafy.backend.domain.room.dto.response.RoomSearchResponse;
import com.ssafy.backend.domain.room.dto.response.RoomsListResponse;
import com.ssafy.backend.domain.room.dto.response.RoomsSearchResponse;
import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.domain.room.repository.RoomRepository;
import com.ssafy.backend.global.enums.ResponseCode;
import com.ssafy.backend.global.enums.RoomStatus;
import com.ssafy.backend.global.exception.CustomException;
import com.ssafy.backend.global.util.SecurityUtils;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomService {

	private final RoomRepository roomRepository;
	private final SessionRepository sessionRepository;
	private final ParticipantRepository participantRepository;

	private static final int ROOM_CODE_LENGTH = 6;
	private static final String ROOM_CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	public RoomCreateResponse createRoom(RoomCreateRequest request) {

		SessionEntity session = sessionRepository.findByNickname(request.hostNickname())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		if (roomRepository.existsBySession(session) || participantRepository.existsBySession(session)) {
			throw new CustomException(ResponseCode.ALREADY_IN_ROOM);
		}

		String roomCode = generateUniqueRoomCode();
		Room room = Room.builder()
			.session(session)
			.roomCode(roomCode)
			.roomName(request.roomName())
			.password(request.password())
			.roundCount(request.roundCount())
			.gameMode(request.gameMode())
			.videoMode(request.videoMode())
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
			.gameMode(room.getGameMode().name())
			.videoMode(room.getVideoMode().name())
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
	public void joinRoomByCode(RoomJoinByCodeRequest request) {
		SessionEntity session = sessionRepository.findByNickname(SecurityUtils.getCurrentNickname())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		if (roomRepository.existsBySession(session) || participantRepository.existsBySession(session)) {
			throw new CustomException(ResponseCode.ALREADY_IN_ROOM);
		}

		Room room = roomRepository.findByRoomCode(request.roomCode())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		if (room.getRoomStatus() == RoomStatus.playing) {
			throw new CustomException(ResponseCode.ROOM_PLAYING);
		}

		int currentParticipants = participantRepository.countByRoom(room);
		if (currentParticipants >= 6) {
			throw new CustomException(ResponseCode.ROOM_FULL);
		}

		Participant participant = Participant.builder()
			.session(session)
			.room(room)
			.isActive(true)
			.createdAt(LocalDateTime.now())
			.updatedAt(LocalDateTime.now())
			.build();
		participantRepository.save(participant);
	}

	// 비밀번호로 방 입장
	public void joinRoomByPassword(RoomJoinByPasswordRequest request) {
		SessionEntity session = sessionRepository.findByNickname(SecurityUtils.getCurrentNickname())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		if (roomRepository.existsBySession(session) || participantRepository.existsBySession(session)) {
			throw new CustomException(ResponseCode.ALREADY_IN_ROOM);
		}

		Room room = roomRepository.findByRoomCode(request.roomCode())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		checkPassword(room, request.password());

		if (room.getRoomStatus() == RoomStatus.playing) {
			throw new CustomException(ResponseCode.ROOM_PLAYING);
		}

		int currentParticipants = participantRepository.countByRoom(room);
		if (currentParticipants >= 6) {
			throw new CustomException(ResponseCode.ROOM_FULL);
		}

		Participant participant = Participant.builder()
			.session(session)
			.room(room)
			.isActive(true)
			.createdAt(LocalDateTime.now())
			.updatedAt(LocalDateTime.now())
			.build();
		participantRepository.save(participant);
	}

	// 비밀번호 확인
	public void checkPassword(Room room, String password) {
		if (!room.getPassword().equals(password)) {
			throw new CustomException(ResponseCode.FORBIDDEN);
		}
	}

	/** 방 목록 조회 */
	@Transactional(readOnly = true)
	public RoomsListResponse getRoomsList() {
		List<Room> rooms = roomRepository.findAll();
		List<RoomInfo> roomInfos = rooms.stream()
			.map(room -> {
				int count = participantRepository.countByRoom(room);
				return RoomInfo.builder()
					.roomName(room.getRoomName())
					.roomCode(room.getRoomCode())
					.isSecret(room.getPassword() != null && !room.getPassword().isEmpty())
					.playerCount(count)
					.roundCount(room.getRoundCount())
					.gameMode(room.getGameMode().name())
					.videoMode(room.getVideoMode().name())
					.category(room.getCategory().name())
					.hostNickname(room.getSession().getNickname())
					.status(room.getRoomStatus().name())
					.build();
			})
			.collect(Collectors.toList());
		return new RoomsListResponse(roomInfos);
	}

	/** 특정 roomCode 방의 참가자 목록 조회 */
	public ParticipantsListResponse getParticipants(String roomCode) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		var participants = participantRepository.findByRoom(room).stream()
			.map(p -> new ParticipantInfo(
				p.getId(),
				p.getSession().getNickname(),
				p.isActive()
			))
			.collect(Collectors.toList());

		return new ParticipantsListResponse(participants);
	}

	/** roomName을 포함한 방들을 검색합니다. */
	public RoomsSearchResponse searchRooms(String roomName) {
		var rooms = roomRepository.findByRoomNameContaining(roomName);
		var result = rooms.stream()
			.map(room -> {
				int count = participantRepository.countByRoom(room) + 1;
				return new RoomSearchResponse(
					room.getRoomName(),
					room.getSession().getNickname(),
					count,
					room.getRoomStatus().name(),
					room.getPassword() != null && !room.getPassword().isEmpty()
				);
			})
			.collect(Collectors.toList());
		return new RoomsSearchResponse(result);
	}

	/**
	 * roomCode 로 방을 조회하고, 방 정보 + 참가자 목록을 합쳐서 반환합니다
	 */
	public RoomDetailResponse getRoomDetail(String roomCode) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		// 1) RoomInfo 생성 (참여자 수 = 참가 테이블 수 + 1(호스트))
		int participantCount = participantRepository.countByRoom(room);
		RoomInfo info = RoomInfo.builder()
			.roomName(room.getRoomName())
			.roomCode(room.getRoomCode())
			.isSecret(room.getPassword() != null && !room.getPassword().isEmpty())
			.playerCount(participantCount)
			.roundCount(room.getRoundCount())
			.gameMode(room.getGameMode().name())
			.videoMode(room.getVideoMode().name())
			.category(room.getCategory().name())
			.hostNickname(room.getSession().getNickname())
			.status(room.getRoomStatus().name())
			.build();

		// 2) ParticipantResponse 리스트 생성
		List<ParticipantInfo> parts = participantRepository.findByRoom(room).stream()
			.map(p -> new ParticipantInfo(
				p.getId(),
				p.getSession().getNickname(),
				p.isActive()
			))
			.collect(Collectors.toList());

		return new RoomDetailResponse(info, parts);
	}
}
