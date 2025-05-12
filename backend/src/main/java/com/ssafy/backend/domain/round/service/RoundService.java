package com.ssafy.backend.domain.round.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.auth.repository.SessionRepository;
import com.ssafy.backend.domain.chat.service.ChatSocketService;
import com.ssafy.backend.domain.participant.entity.Participant;
import com.ssafy.backend.domain.participant.entity.ParticipantRound;
import com.ssafy.backend.domain.participant.repository.ParticipantRepository;
import com.ssafy.backend.domain.participant.repository.ParticipantRoundRepository;
import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.domain.room.repository.RoomRepository;
import com.ssafy.backend.domain.round.dto.request.EndRoundRequestDto;
import com.ssafy.backend.domain.round.dto.request.GuessRequestDto;
import com.ssafy.backend.domain.round.dto.request.RoundStartRequest;
import com.ssafy.backend.domain.round.dto.request.TurnUpdateRequestDto;
import com.ssafy.backend.domain.round.dto.request.VoteRequestDto;
import com.ssafy.backend.domain.round.dto.response.GuessResponseDto;
import com.ssafy.backend.domain.round.dto.response.PlayerRoundInfoResponse;
import com.ssafy.backend.domain.round.dto.request.RoundSettingRequest;
import com.ssafy.backend.domain.round.dto.response.ScoresResponseDto;
import com.ssafy.backend.domain.round.dto.response.VoteResponseDto;
import com.ssafy.backend.domain.round.dto.response.VoteResultsResponseDto;
import com.ssafy.backend.domain.round.dto.response.VoteResultsResponseDto.Result;
import com.ssafy.backend.domain.round.entity.CategoryWord;
import com.ssafy.backend.domain.round.entity.Round;
import com.ssafy.backend.domain.round.repository.CategoryWordRepository;
import com.ssafy.backend.domain.round.repository.RoundRepository;
import com.ssafy.backend.global.enums.ResponseCode;
import com.ssafy.backend.global.enums.Category;
import com.ssafy.backend.global.enums.GameMode;
import com.ssafy.backend.global.enums.RoundStatus;
import com.ssafy.backend.global.enums.Winner;
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
	private final ChatSocketService chatSocketService;

	@Transactional
	public void deleteGame(String roomCode) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		List<Round> rounds = roundRepository.findByRoom(room);

		// ParticipantRound -> Round -> Participant -> Room 순서로 삭제
		for (Round round : rounds) {
			participantRoundRepository.deleteByRound(round);
		}
		roundRepository.deleteAll(rounds);

		chatSocketService.gameEnded(roomCode);
	}

	@Transactional
	public void settingRound(RoundSettingRequest request) {
		Room room = roomRepository.findByRoomCode(request.roomCode())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		GameMode gameMode = room.getGameMode();
		Category category = room.getCategory();

		int nextRoundNumber = roundRepository
			.findTopByRoomOrderByRoundNumberDesc(room)
			.map(r -> r.getRoundNumber() + 1)
			.orElse(1);

		List<CategoryWord> candidates =
			category  == Category.랜덤
				? categoryWordRepository.findAll()
				: categoryWordRepository.findByCategory(category );
		if (candidates.isEmpty()) {
			throw new CustomException(ResponseCode.NOT_FOUND);
		}

		String w1 = candidates.get(random.nextInt(candidates.size())).getWord();
		String w2 = "";
		if (gameMode  == GameMode.FOOL) {
			w2 = gptService.getSimilarWord(w1, category.name());
		}

		Round round = Round.builder()
			.room(room)
			.roundNumber(nextRoundNumber)
			.word1(w1)
			.word2(w2)
			.roundStatus(RoundStatus.waiting)
			.turn(1)
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

		chatSocketService.roundSet(request.roomCode(), nextRoundNumber);
	}

	@Transactional(readOnly = true)
	public PlayerRoundInfoResponse getPlayerRoundInfo(String roomCode) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		Round round = roundRepository.findTopByRoomOrderByRoundNumberDesc(room)
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

		List<PlayerRoundInfoResponse.PlayerPositionInfo> positions = prList.stream()
			.map(pr -> new PlayerRoundInfoResponse.PlayerPositionInfo(
				pr.getParticipant().getSession().getNickname(),
				pr.getOrder()
			))
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

		return new PlayerRoundInfoResponse(
			round.getRoundNumber(),
			room.getRoundCount(),
			positions,
			word
		);
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

		chatSocketService.roundStarted(request.roomCode(), request.roundNumber());
	}

	@Transactional
	public VoteResponseDto vote(String roomCode, int roundNumber, VoteRequestDto request) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		Round round = roundRepository.findByRoomAndRoundNumber(room, roundNumber)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		String myNickname = SecurityUtils.getCurrentNickname();
		if (myNickname == null) throw new CustomException(ResponseCode.UNAUTHORIZED);

		SessionEntity session = sessionRepository.findByNickname(myNickname)
			.orElseThrow(() -> new CustomException(ResponseCode.UNAUTHORIZED));

		Participant self = participantRepository.findByRoomAndSessionAndActive(room, session)
			.orElseThrow(() -> new CustomException(ResponseCode.FORBIDDEN));

		ParticipantRound pr = participantRoundRepository.findByRoundAndParticipant(round, self)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		String targetNickname = null;
		if (request.targetParticipantNickname() != null) {
			SessionEntity targetSession = sessionRepository.findByNickname(request.targetParticipantNickname())
				.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

			Participant target = participantRepository.findBySessionAndActive(targetSession)
				.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

			if (!target.getRoom().equals(room)) {
				throw new CustomException(ResponseCode.INVALID_REQUEST);
			}
			pr.voteTargetParticipant(target);
			targetNickname = target.getSession().getNickname();
		} else {
			pr.voteTargetParticipant(null);
		}

		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				checkAndNotifyVoteCompleted(roomCode, round.getId());
			}
		});

		return new VoteResponseDto(
			myNickname,
			targetNickname
		);
	}

	public void checkAndNotifyVoteCompleted(String roomCode, Long roundId) {
		Round round = roundRepository.findById(roundId)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		long total = participantRoundRepository.countByRound(round);
		long voted = participantRoundRepository.countByRoundAndHasVotedTrue(round);

		if (voted == total) {
			chatSocketService.voteCompleted(roomCode);
		}
	}

	@Transactional(readOnly = true)
	public VoteResultsResponseDto getVoteResults(String roomCode, int roundNumber) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		Round round = roundRepository.findByRoomAndRoundNumber(room, roundNumber)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		String nickname = SecurityUtils.getCurrentNickname();
		if (nickname == null) throw new CustomException(ResponseCode.UNAUTHORIZED);

		List<ParticipantRound> prList = participantRoundRepository.findByRound(round);

		Map<Long, Integer> countMap = new HashMap<>();
		int skipCount = 0;
		for (ParticipantRound pr : prList) {
			Participant target = pr.getTargetParticipant();
			if (target == null) {
				skipCount++;
			} else {
				long tid = target.getId();
				countMap.put(tid, countMap.getOrDefault(tid, 0) + 1);
			}
		}

		for (ParticipantRound pr : prList) {
			long pid = pr.getParticipant().getId();
			countMap.putIfAbsent(pid, 0);
		}

		Map<Long, String> nicknameMap = prList.stream()
			.collect(Collectors.toMap(
				pr -> pr.getParticipant().getId(),
				pr -> pr.getParticipant().getSession().getNickname()
			));

		List<Result> results = countMap.entrySet().stream()
			.map(e -> new Result(
				nicknameMap.get(e.getKey()),
				e.getValue()
			))
			.collect(Collectors.toList());

		results.add(new Result(null, skipCount));

		List<Integer> nonSkipCounts = countMap.values().stream().toList();
		int maxCount = nonSkipCounts.isEmpty() ? 0 : Collections.max(nonSkipCounts);
		int minCount = nonSkipCounts.isEmpty() ? 0 : Collections.min(nonSkipCounts);

		boolean skipFlag;
		if (nonSkipCounts.isEmpty()) {
			skipFlag = true;
		} else if (skipCount >= maxCount) {
			skipFlag = true;
		} else if (minCount == maxCount) {
			skipFlag = true;
		} else {
			skipFlag = false;
		}

		Participant liar = prList.stream()
			.filter(ParticipantRound::isLiar)
			.findFirst()
			.map(ParticipantRound::getParticipant)
			.orElseThrow(() -> new CustomException(ResponseCode.SERVER_ERROR));

		String liarNickname = liar.getSession().getNickname();
		Long liarId = liar.getId();

		Long selectedId = null;
		Boolean detected = null;
		if (!skipFlag) {
			selectedId = countMap.entrySet().stream()
				.max(Map.Entry.comparingByValue())
				.get().getKey();
			detected = selectedId.equals(liarId);
		}

		return new VoteResultsResponseDto(
			results,
			skipFlag,
			selectedId,
			detected,
			skipFlag ? null : liarNickname,
			skipFlag ? null : liarId
		);
	}

	public GuessResponseDto submitGuess(String roomCode,
		int roundNumber,
		GuessRequestDto req) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		Round round = roundRepository.findByRoomAndRoundNumber(room, roundNumber)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		String targetWord = switch (room.getGameMode()) {
			case DEFAULT -> round.getWord1();
			case FOOL    -> round.getWord2();
		};

		boolean isCorrect = req.guessText().equalsIgnoreCase(targetWord);

		Winner winnerEnum;
		if (room.getGameMode() == GameMode.DEFAULT) {
			winnerEnum = isCorrect ? Winner.liar : Winner.civil;
		} else {
			winnerEnum = isCorrect ? Winner.civil : Winner.liar;
		}

		List<ParticipantRound> prList = participantRoundRepository.findByRound(round);

		if (winnerEnum == Winner.civil) {
			prList.stream()
				.filter(pr -> !pr.isLiar())
				.forEach(pr -> pr.addScore(100));
		} else {
			prList.stream()
				.filter(ParticipantRound::isLiar)
				.forEach(pr -> pr.addScore(100));
		}

		round.setWinner(winnerEnum);

		chatSocketService.guessSubmitted(roomCode, req.guessText());

		return new GuessResponseDto(isCorrect, winnerEnum.name());
	}

	/**
	 * 방별 누적 점수 조회
	 */
	@Transactional(readOnly = true)
	public ScoresResponseDto getScores(String roomCode) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		List<Round> rounds = roundRepository.findByRoom(room);

		List<ParticipantRound> allPRs = new ArrayList<>();
		for (Round r : rounds) {
			allPRs.addAll(participantRoundRepository.findByRound(r));
		}

		Map<String, Integer> scoreMap = new HashMap<>();
		for (ParticipantRound pr : allPRs) {
			String nick = pr.getParticipant().getSession().getNickname();
			scoreMap.put(nick, scoreMap.getOrDefault(nick, 0) + pr.getScore());
		}

		List<ScoresResponseDto.ScoreEntry> entries = scoreMap.entrySet().stream()
			.map(e -> new ScoresResponseDto.ScoreEntry(e.getKey(), e.getValue()))
			.collect(Collectors.toList());

		return new ScoresResponseDto(entries);
	}

	public void finishRound(EndRoundRequestDto req) {
		Room room = roomRepository.findByRoomCode(req.roomCode())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		Round round = roundRepository.findByRoomAndRoundNumber(room, req.roundNumber())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		round.setRoundStatus(RoundStatus.finished);
		round.setUpdatedAt(LocalDateTime.now());
		roundRepository.save(round);

		if (req.roundNumber() == room.getRoundCount()) {
			deleteGame(req.roomCode());
		}
	}

	@Transactional
	public void updateTurn(TurnUpdateRequestDto req) {
		Room room = roomRepository.findByRoomCode(req.roomCode())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		Round round = roundRepository.findByRoomAndRoundNumber(room, req.roundNumber())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		round.incrementTurn();
		participantRoundRepository.resetHasVotedByRound(round);

		roundRepository.save(round);
	}
}
