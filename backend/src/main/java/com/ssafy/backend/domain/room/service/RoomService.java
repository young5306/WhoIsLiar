package com.ssafy.backend.domain.room.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

import com.ssafy.backend.domain.round.service.RoundService;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.auth.repository.SessionRepository;
import com.ssafy.backend.domain.chat.service.ChatSocketService;
import com.ssafy.backend.domain.participant.entity.Participant;
import com.ssafy.backend.domain.participant.repository.ParticipantRepository;
import com.ssafy.backend.domain.room.dto.request.RoomCreateRequest;
import com.ssafy.backend.domain.room.dto.request.RoomJoinByCodeRequest;
import com.ssafy.backend.domain.room.dto.request.RoomJoinByPasswordRequest;
import com.ssafy.backend.domain.room.dto.request.SelectCategoryRequest;
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
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RoomService {

	private static final int ROOM_CODE_LENGTH = 6;
	private static final String ROOM_CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	private final RoomRepository roomRepository;
	private final SessionRepository sessionRepository;
	private final ParticipantRepository participantRepository;
	private final ChatSocketService chatSocketService;
	private final RoundService roundService;

	// 방을 생성하고 호스트를 참가자로 등록
	@Transactional
	public RoomCreateResponse createRoom(RoomCreateRequest request) {

		SessionEntity session = sessionRepository.findByNickname(request.hostNickname())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		if (roomRepository.existsBySession(session) || participantRepository.existsBySessionAndIsActiveTrue(session)) {
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

		if (roomRepository.existsBySession(session) || participantRepository.existsBySessionAndIsActiveTrue(session)) {
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

	// 비밀번호를 입력하여 방 참여
	@Transactional
	public void joinRoomByPassword(RoomJoinByPasswordRequest request) {
		SessionEntity session = sessionRepository.findByNickname(SecurityUtils.getCurrentNickname())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		if (roomRepository.existsBySession(session) || participantRepository.existsBySessionAndIsActiveTrue(session)) {
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

	// 방의 비밀번호가 올바른지 확인
	public void checkPassword(Room room, String password) {
		if (!room.getPassword().equals(password)) {
			throw new CustomException(ResponseCode.FORBIDDEN);
		}
	}

	// 전체 방 목록을 조회
	@Transactional(readOnly = true)
	public RoomsListResponse getRoomsList() {
		// List<Room> rooms = roomRepository.findAll();
		List<Room> rooms = roomRepository.findAll(
			Sort.by(Sort.Direction.DESC, "createdAt")
		);
		List<RoomInfo> roomInfos = rooms.stream()
			.map(room -> {
				int count = participantRepository.countByRoomAndIsActiveTrue(room);
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
				p.isActive(),
				p.getReadyStatus()
			))
			.collect(Collectors.toList());

		return new ParticipantsListResponse(participants);
	}

	/** roomName을 포함한 방들을 검색합니다. */
	public RoomsSearchResponse searchRooms(String roomName) {
		// var rooms = roomRepository.findByRoomNameContaining(roomName);
		var rooms = roomRepository.findByRoomNameContaining(roomName,
			Sort.by(Sort.Direction.DESC, "createdAt")
		);
		var result = rooms.stream()
			.map(room -> {
				int count = participantRepository.countByRoom(room);
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
				p.isActive(),
			    p.getReadyStatus()
			))
			.collect(Collectors.toList());

		return new RoomDetailResponse(info, parts);
	}

	// 방 나가기
	@Transactional
	public void leaveRoom(String roomCode) {
		String nickname = SecurityUtils.getCurrentNickname();
		if (nickname == null) {
			throw new CustomException(ResponseCode.UNAUTHORIZED);
		}

		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		SessionEntity session = sessionRepository.findByNickname(nickname)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		Participant participant = participantRepository.findByRoomAndSession(room, session)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		boolean wasHost = room.getSession().equals(session);

		if (room.getRoomStatus() == RoomStatus.playing) {
			participant.setActive(false);
		} else {
			participantRepository.deleteById(participant.getId());
		}

		if (wasHost) {
			List<Participant> remain = participantRepository
				.findByRoomAndIsActiveTrueOrderByCreatedAtAsc(room);

			if (remain.isEmpty()) {
				roomRepository.deleteById(room.getId());
			} else {
				SessionEntity newHost = remain.get(0).getSession();
				room.setSession(newHost);
				roundService.initReadyStatus(room);
				room.setUpdatedAt(LocalDateTime.now());
				roomRepository.save(room);
			}
		} else {
			int activeCount = participantRepository.countByRoomAndIsActiveTrue(room);
			if (activeCount == 0) {
				roomRepository.deleteById(room.getId());
			}
		}
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

	// 카테고리 선택
	public void selectCategory(SelectCategoryRequest request) {
		Room room = roomRepository.findByRoomCode(request.roomCode())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		room.selectCategory(request.category());

		chatSocketService.categorySelected(request.roomCode(), request.category());
	}

	// 참가자 준비 상태
	// 룸 코드를 req로 전달받음.
	// 룸 코드와 닉네임을 이용해서 participate 테이블에서 레디를 요청한 유저의 ready_status를 변경. (false일때는 true, true일때는 false)
	// 그리고 이때 마다 웹소켓 chatType == "READY_STATUS"로 ready_status 보내줌.
	// 그리고 room의 참가인원 -1 만큼 ready_status의 true 개수가 된다면, 참가자 전원 준비완료
	// 이때 host에게 chatType == "ROOM_READY_STATUS"를 true로 반환.

	public void gameReady(String roomCode) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		String nickName = SecurityUtils.getCurrentNickname();

		Participant participant = participantRepository
				.findByRoomCodeAndNickname(roomCode, nickName)
				.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		participant.setReadyStatus(!participant.getReadyStatus()); // 누른애의 레디 상태

		chatSocketService.sendReadyStatus(roomCode, nickName, participant.getReadyStatus()); // 레디하면 누른애들한테 소켓

		long readyCount = participantRepository.countByRoom_RoomCodeAndReadyStatusTrue(roomCode); // 몇 명이 준비함

		int totalParticipants = participantRepository.countByRoom(room); // 현재 입장한 사람 수

		// host에게만 알림
		if (readyCount == totalParticipants - 1) {
			chatSocketService.sendRoomReadyStatus(roomCode, true);
		}else {
			chatSocketService.sendRoomReadyStatus(roomCode, false);
		}
	}

//	@Transactional(propagation = Propagation.REQUIRES_NEW)
//	public void gameReady(String roomCode) {
//		Room room = roomRepository.findByRoomCode(roomCode)
//				.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
//
//		String nickName = SecurityUtils.getCurrentNickname();
//
//		Participant participant = participantRepository
//				.findByRoomCodeAndNickname(roomCode, nickName)
//				.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
//
//		// 상태 토글
//		participant.setReadyStatus(!participant.getReadyStatus());
//
//		// 변경된 상태 저장
//		participantRepository.save(participant);
//
//		// afterCommit 콜백으로 지연 실행
//		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
//			@Override
//			public void afterCommit() {
//				// 1. 레디를 누른 유저의 본인 레디 상태 웹소켓 전송
//				chatSocketService.sendReadyStatus(roomCode, nickName, participant.getReadyStatus());
//
//				// 2. 레디 인원 수 계산 및 방장에게 전체 준비 여부 전송
//				long readyCount = participantRepository.countByRoom_RoomCodeAndReadyStatusTrue(roomCode);
//				int totalParticipants = participantRepository.countByRoom(room);
//
//				boolean allReadyExceptHost = (readyCount == totalParticipants - 1);
//				chatSocketService.sendRoomReadyStatus(roomCode, allReadyExceptHost);
//			}
//		});
//	}

}
