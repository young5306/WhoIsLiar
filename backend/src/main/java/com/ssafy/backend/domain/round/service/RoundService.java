package com.ssafy.backend.domain.round.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.auth.repository.SessionRepository;
import com.ssafy.backend.domain.participant.entity.Participant;
import com.ssafy.backend.domain.participant.entity.ParticipantRound;
import com.ssafy.backend.domain.participant.repository.ParticipantRepository;
import com.ssafy.backend.domain.participant.repository.ParticipantRoundRepository;
import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.domain.room.repository.RoomRepository;
import com.ssafy.backend.domain.round.dto.request.RoundStartRequest;
import com.ssafy.backend.domain.round.dto.response.PlayerPositionDto;
import com.ssafy.backend.domain.round.dto.response.PlayerRoundInfoResponse;
import com.ssafy.backend.domain.round.dto.request.RoundSettingRequest;
import com.ssafy.backend.domain.round.entity.CategoryWord;
import com.ssafy.backend.domain.round.entity.Round;
import com.ssafy.backend.domain.round.repository.CategoryWordRepository;
import com.ssafy.backend.domain.round.repository.RoundRepository;
import com.ssafy.backend.global.enums.ResponseCode;
import com.ssafy.backend.global.enums.Category;
import com.ssafy.backend.global.enums.GameMode;
import com.ssafy.backend.global.enums.RoomStatus;
import com.ssafy.backend.global.enums.RoundStatus;
import com.ssafy.backend.global.exception.CustomException;
import com.ssafy.backend.global.util.SecurityUtils;
import com.ssafy.backend.integration.gpt.GptService;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class RoundService {

	private final RoomRepository roomRepository;
	private final ParticipantRepository participantRepository;
	private final ParticipantRoundRepository participantRoundRepository;
	private final RoundRepository roundRepository;
	private final CategoryWordRepository categoryWordRepository;
	private final Random random = new Random();
	private final GptService gptService;
	private final SessionRepository sessionRepository;

	@Transactional
	public void deleteGame(String roomCode) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		List<Round> rounds = roundRepository.findByRoom(room);
		List<Participant> participants = participantRepository.findByRoomAndActive(room);

		// 1. ParticipantRound 먼저 삭제
		for (Round round : rounds) {
			participantRoundRepository.deleteByRound(round);
		}

		// 2. Round 삭제
		roundRepository.deleteAll(rounds);

		// 3. Participant 삭제 (isActive == true만)
		participantRepository.deleteAll(participants);

		// 4. Room 삭제
		roomRepository.delete(room);
	}

	@Transactional
	public void settingRound(RoundSettingRequest request) {
		Room room = roomRepository.findByRoomCode(request.roomCode())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		room.setGameMode(request.gameMode());
		room.setCategory(request.category());
		if (room.getRoomStatus() != RoomStatus.playing) {
			room.setRoomStatus(RoomStatus.playing);
		}
		room.setUpdatedAt(LocalDateTime.now());

		List<CategoryWord> candidates =
			request.category() == Category.랜덤
				? categoryWordRepository.findAll()
				: categoryWordRepository.findByCategory(request.category());
		if (candidates.isEmpty()) {
			throw new CustomException(ResponseCode.NOT_FOUND);
		}

		String w1 = candidates.get(random.nextInt(candidates.size())).getWord();
		String w2 = "";
		if (request.gameMode() == GameMode.FOOL) {
			w2 = gptService.getSimilarWord(w1, room.getCategory().name());
		}

		Round round = Round.builder()
			.room(room)
			.roundNumber(request.roundNumber())
			.word1(w1)
			.word2(w2)
			.roundStatus(RoundStatus.waiting)
			.winner(null)
			.createdAt(LocalDateTime.now())
			.updatedAt(LocalDateTime.now())
			.build();
		roundRepository.save(round);

		List<Participant> parts = participantRepository.findByRoomAndActive(room);
		if (parts.isEmpty()) {
			throw new CustomException(ResponseCode.CONFLICT);
		}

		List<Integer> orders = IntStream.rangeClosed(1, parts.size())
			.boxed().collect(Collectors.toList());
		Collections.shuffle(orders);

		int liarIdx = random.nextInt(parts.size());

		for (int i = 0; i < parts.size(); i++) {
			Participant p = parts.get(i);
			ParticipantRound pr = ParticipantRound.builder()
				.participant(p)
				.round(round)
				.order(orders.get(i))
				.isLiar(i == liarIdx)
				.targetParticipant(null)
				.score(0)
				.createdAt(LocalDateTime.now())
				.build();
			participantRoundRepository.save(pr);
		}
	}

	@Transactional(readOnly = true)
	public PlayerRoundInfoResponse getPlayerRoundSetup(String roomCode, int roundNumber) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		Round round = roundRepository.findByRoomAndRoundNumber(room, roundNumber)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		String nickname = SecurityUtils.getCurrentNickname();
		if (nickname == null) {
			throw new CustomException(ResponseCode.UNAUTHORIZED);
		}
		SessionEntity session = sessionRepository.findByNickname(nickname)
			.orElseThrow(() -> new CustomException(ResponseCode.UNAUTHORIZED));

		Participant meParticipant = participantRepository
			.findByRoomAndSession(room, session)
			.orElseThrow(() -> new CustomException(ResponseCode.FORBIDDEN));

		List<ParticipantRound> prList = participantRoundRepository.findByRound(round);

		List<PlayerPositionDto> participants = prList.stream()
			.map(pr -> new PlayerPositionDto(
				pr.getParticipant().getId(),
				pr.getOrder()))
			.collect(Collectors.toList());

		boolean isLiar = prList.stream()
			.filter(pr -> pr.getParticipant().getId().equals(meParticipant.getId()))
			.findFirst()
			.map(ParticipantRound::isLiar)
			.orElseThrow(() -> new CustomException(ResponseCode.FORBIDDEN));

		String word;
		if (room.getGameMode() == GameMode.DEFAULT) {
			word = isLiar ? "" : round.getWord1();
		} else {
			word = isLiar ? round.getWord2() : round.getWord1();
		}

		return new PlayerRoundInfoResponse(participants, word);
	}

	public void startRound(RoundStartRequest request) {
		Room room = roomRepository.findByRoomCode(request.roomCode())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		Round round = roundRepository.findByRoomAndRoundNumber(room, request.roundNumber())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		if (round.getRoundStatus() != RoundStatus.waiting) {
			throw new CustomException(ResponseCode.CONFLICT);
		}

		round.setRoundStatus(RoundStatus.discussion);
		round.setUpdatedAt(LocalDateTime.now());
		roundRepository.save(round);
	}
}
