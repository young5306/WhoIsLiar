package com.ssafy.backend.domain.room.service;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.auth.repository.SessionRepository;
import com.ssafy.backend.domain.chat.service.ChatSocketService;
import com.ssafy.backend.domain.participant.entity.Participant;
import com.ssafy.backend.domain.participant.repository.ParticipantRepository;
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
	private final ChatSocketService chatSocketService;

	private static final int ROOM_CODE_LENGTH = 6;
	private static final String ROOM_CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	// 방을 생성하고 호스트를 참가자로 등록
	@Transactional
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

		chatSocketService.playerJoined(roomCode, SecurityUtils.getCurrentNickname());

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

	// 중복되지 않는 방 코드를 생성
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

	// 방 코드로 공개 방에 참여
	@Transactional
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

		chatSocketService.playerJoined(request.roomCode(), SecurityUtils.getCurrentNickname());
	}

	// 비밀번호를 입력하여 방 참여
	@Transactional
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

		chatSocketService.playerJoined(request.roomCode(), SecurityUtils.getCurrentNickname());
	}

	// 방의 비밀번호가 올바른지 확인
	public void checkPassword(Room room, String password) {
		if (!room.getPassword().equals(password)) {
			throw new CustomException(ResponseCode.FORBIDDEN);
		}
	}

	// 전체 방 목록을 조회
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

	// 방에 참가한 사용자 목록을 조회
	@Transactional(readOnly = true)
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

	// 방의 상세 정보와 참가자 목록
	@Transactional(readOnly = true)
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

	// 방 나가기
	@Transactional
	public void leaveRoom(String roomCode) {
		String nickname = SecurityUtils.getCurrentNickname();

		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		SessionEntity session = sessionRepository.findByNickname(nickname)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		Participant participant = participantRepository.findByRoomAndSession(room, session)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		if (room.getRoomStatus() == RoomStatus.waiting) {
			// 참가자 제거
			participantRepository.delete(participant);

			// (남은 참가자 수 == 0) => 방 삭제
			int remainingCount = participantRepository.countByRoom(room);
			if (remainingCount == 0) {
				roomRepository.delete(room); // 마지막 인원이면 방도 삭제
			}
		} else if (room.getRoomStatus() == RoomStatus.playing) {
			// 게임 중이면 비활성화만
			participant.setActive(false);
		} else {
			throw new CustomException(ResponseCode.SERVER_ERROR);
		}

		chatSocketService.playerLeft(roomCode, nickname);
	}

	// 게임 시작(상태값 playing으로 변경)
	public void startGame(String roomCode) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		if (room.getRoomStatus() == RoomStatus.playing) {
			throw new CustomException(ResponseCode.ROOM_PLAYING);
		}

		room.startGame(RoomStatus.playing);

		chatSocketService.gameStarted(roomCode);
	}
}
