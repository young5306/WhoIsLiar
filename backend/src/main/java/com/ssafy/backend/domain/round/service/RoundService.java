package com.ssafy.backend.domain.round.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
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
import com.ssafy.backend.domain.round.dto.request.RoundSettingRequest;
import com.ssafy.backend.domain.round.dto.request.RoundStartRequest;
import com.ssafy.backend.domain.round.dto.request.TurnUpdateRequestDto;
import com.ssafy.backend.domain.round.dto.request.VoteRequestDto;
import com.ssafy.backend.domain.round.dto.response.GuessResponseDto;
import com.ssafy.backend.domain.round.dto.response.PlayerRoundInfoResponse;
import com.ssafy.backend.domain.round.dto.response.ScoresResponseDto;
import com.ssafy.backend.domain.round.dto.response.TurnUpdateResponse;
import com.ssafy.backend.domain.round.dto.response.VoteResponseDto;
import com.ssafy.backend.domain.round.dto.response.VoteResultsResponseDto;
import com.ssafy.backend.domain.round.dto.response.VoteResultsResponseDto.Result;
import com.ssafy.backend.domain.round.dto.response.WordResponseDto;
import com.ssafy.backend.domain.round.entity.CategoryWord;
import com.ssafy.backend.domain.round.entity.Round;
import com.ssafy.backend.domain.round.entity.Synonym;
import com.ssafy.backend.domain.round.event.AllVotesCompletedEvent;
import com.ssafy.backend.domain.round.repository.CategoryWordRepository;
import com.ssafy.backend.domain.round.repository.RoundRepository;
import com.ssafy.backend.domain.round.repository.SynonymRepository;
import com.ssafy.backend.global.enums.Category;
import com.ssafy.backend.global.enums.GameMode;
import com.ssafy.backend.global.enums.ResponseCode;
import com.ssafy.backend.global.enums.RoomStatus;
import com.ssafy.backend.global.enums.RoundStatus;
import com.ssafy.backend.global.enums.Winner;
import com.ssafy.backend.global.exception.CustomException;
import com.ssafy.backend.global.util.SecurityUtils;
import com.ssafy.backend.integration.gpt.GptService;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class RoundService {

	private static final ConcurrentMap<Long, Integer> lastNotifiedTurn = new ConcurrentHashMap<>();
	private final RoomRepository roomRepository;
	private final ParticipantRepository participantRepository;
	private final ParticipantRoundRepository participantRoundRepository;
	private final RoundRepository roundRepository;
	private final CategoryWordRepository categoryWordRepository;
	private final Random random = new Random();
	private final GptService gptService;
	private final SessionRepository sessionRepository;
	private final ChatSocketService chatSocketService;
	private final TurnTimerService turnTimerService;
	private final SynonymRepository synonymRepository;

	private final ApplicationEventPublisher eventPublisher;

	@PersistenceContext
	private EntityManager em;

	@Transactional
	public void deleteGame(String roomCode) {

		turnTimerService.cancelTurnSequence(roomCode);

		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		List<Round> rounds = roundRepository.findByRoom(room);

		// ParticipantRound -> Round -> Participant -> Room 순서로 삭제
		for (Round round : rounds) {
			participantRoundRepository.deleteByRound(round);
		}
		roundRepository.deleteAll(rounds);
		room.finishGame(RoomStatus.waiting);
		initReadyStatus(room);

		List<Participant> inactive = participantRepository.findByRoomAndIsActiveFalse(room);
		if (!inactive.isEmpty()) {
			participantRepository.deleteAll(inactive);
		}

		chatSocketService.gameEnded(roomCode);
	}

	public void initReadyStatus(Room room) {
		// 모든 참가자의 readyStatus를 false로.
		List<Participant> participants = participantRepository.findByRoom(room);
		for (Participant participant : participants) {
			participant.setReadyStatus(false);
		}
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

		Category actualCategory = category;
		if (category == Category.랜덤) {
			List<Category> selectable = Arrays.stream(Category.values())
				.filter(c -> c != Category.랜덤)
				.collect(Collectors.toList());
			actualCategory = selectable.get(random.nextInt(selectable.size()));
		}
		List<CategoryWord> candidates = categoryWordRepository.findByCategory(actualCategory);
		if (candidates.isEmpty()) {
			throw new CustomException(ResponseCode.NOT_FOUND);
		}

		String w1 = candidates.get(random.nextInt(candidates.size())).getWord();
		String w2 = "";
		if (gameMode == GameMode.FOOL) {
			if (actualCategory == Category.노래) {
				List<String> songList = candidates.stream()
					.map(CategoryWord::getWord)
					.filter(song -> !song.equals(w1))
					.toList();

				if (songList.isEmpty()) {
					w2 = gptService.getSimilarWord(w1, actualCategory.name());
				} else {
					w2 = songList.get(random.nextInt(songList.size()));
				}
			} else {
				w2 = gptService.getSimilarWord(w1, actualCategory.name());
			}
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

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public VoteResponseDto vote(String roomCode, int roundNumber, VoteRequestDto request) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		Round round = roundRepository.findByRoomAndRoundNumber(room, roundNumber)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		String myNickname = SecurityUtils.getCurrentNickname();
		if (myNickname == null)
			throw new CustomException(ResponseCode.UNAUTHORIZED);

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
		participantRoundRepository.save(pr);

		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				log.info("[afterCommit] vote() 콜백 실행 – roomCode={} roundId={}", roomCode, round.getId());
				eventPublisher.publishEvent(new AllVotesCompletedEvent(roomCode, round.getId()));
			}
		});
		log.info("[vote] afterCommit 콜백 등록 완료 – roomCode={} roundId={}", roomCode, round.getId());

		return new VoteResponseDto(
			myNickname,
			targetNickname
		);
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void checkAndNotifyVoteCompleted(String roomCode, Long roundId) {
		Round round = roundRepository.findById(roundId)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		int currentTurn = round.getTurn();

		Integer lastTurn = lastNotifiedTurn.get(roundId);
		if (lastTurn != null && lastTurn == currentTurn) {
			return;
		}

		long totalActive = participantRoundRepository.countByRoundAndParticipantIsActiveTrue(round);
		long votedActive = participantRoundRepository.countByRoundAndHasVotedTrueAndParticipantIsActiveTrue(round);

		if (votedActive == totalActive) {
			Integer prev = lastNotifiedTurn.putIfAbsent(roundId, round.getTurn());
			if (prev == null) {
				// applyVoteScoring(round);

				chatSocketService.voteCompleted(roomCode);
			}
		}
	}

	private void applyVoteScoring(Round round) {
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

		ParticipantRound liarPR = prList.stream()
			.filter(ParticipantRound::isLiar)
			.findFirst()
			.orElseThrow(() -> new CustomException(ResponseCode.SERVER_ERROR));
		long liarId = liarPR.getParticipant().getId();

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

		Long selectedId = null;
		if (!skipFlag) {
			selectedId = countMap.entrySet().stream()
				.max(Map.Entry.comparingByValue())
				.get().getKey();
		}

		boolean wrongPicked = (selectedId != null && selectedId != liarId);
		boolean lastTurnSkip = (selectedId == null && round.getTurn() == 3);

		if (wrongPicked || lastTurnSkip) {
			liarPR.addScore(100);
			participantRoundRepository.save(liarPR);
		}
	}

	@Transactional
	public VoteResultsResponseDto getVoteResults(String roomCode, int roundNumber) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		Round round = roundRepository.findByRoomAndRoundNumber(room, roundNumber)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		String nickname = SecurityUtils.getCurrentNickname();
		if (nickname == null)
			throw new CustomException(ResponseCode.UNAUTHORIZED);

		List<ParticipantRound> allPrList = participantRoundRepository.findByRound(round);
		List<ParticipantRound> prList = allPrList.stream()
			.filter(pr -> pr.getParticipant().isActive())
			.collect(Collectors.toList());

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
			.map(e -> new Result(nicknameMap.get(e.getKey()), e.getValue()))
			.sorted((r1, r2) -> Integer.compare(r2.voteCount(), r1.voteCount()))
			.collect(Collectors.toList());

		results.add(new Result(null, skipCount));

		List<Integer> nonSkipCounts = countMap.values().stream().toList();
		int maxCount = nonSkipCounts.isEmpty() ? 0 : Collections.max(nonSkipCounts);
		int minCount = nonSkipCounts.isEmpty() ? 0 : Collections.min(nonSkipCounts);

		long topTieCount = countMap.values().stream()
			.filter(v -> v == maxCount)
			.count();

		boolean skipFlag;
		if (nonSkipCounts.isEmpty()) {
			skipFlag = true;
		} else if (skipCount >= maxCount) {
			skipFlag = true;
		} else if (minCount == maxCount) {
			skipFlag = true;
		} else if (topTieCount > 1) {
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
			skipFlag && round.getTurn() != 3 ? null : liarNickname,
			skipFlag ? null : liarId
		);
	}

	public GuessResponseDto submitGuess(String roomCode,
		int roundNumber,
		GuessRequestDto req) {

		// 1) 방/라운드 조회
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
		Round round = roundRepository.findByRoomAndRoundNumber(room, roundNumber)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		// 2) 단어 정답 여부 판정
		boolean isCorrect = checkAnswer(round, req);

		// 3) ParticipantRound 목록
		List<ParticipantRound> prList = participantRoundRepository.findByRound(round);
		ParticipantRound liarPR = prList.stream()
			.filter(ParticipantRound::isLiar)
			.findFirst()
			.orElseThrow(() -> new CustomException(ResponseCode.SERVER_ERROR));
		long liarId = liarPR.getParticipant().getId();
		List<ParticipantRound> civPRs = prList.stream()
			.filter(pr -> !pr.isLiar())
			.toList();

		int skipCount = 0;
		Map<Long,Integer> voteCounts = new HashMap<>();
		for (ParticipantRound pr : prList) {
			if (pr.getTargetParticipant() == null) {
				skipCount++;
			} else {
				long tid = pr.getTargetParticipant().getId();
				voteCounts.put(tid, voteCounts.getOrDefault(tid, 0) + 1);
			}
		}

		// 5) nonSkipCounts, maxCount, minCount 계산
		List<Integer> nonSkipCounts = new ArrayList<>(voteCounts.values());
		int maxCount = nonSkipCounts.isEmpty() ? 0 : Collections.max(nonSkipCounts);
		int minCount = nonSkipCounts.isEmpty() ? 0 : Collections.min(nonSkipCounts);

		long topTieCount = voteCounts.values().stream()
			.filter(v -> v == maxCount)
			.count();

		// 6) skipFlag 판정
		boolean skipFlag = checkSkipFlag(nonSkipCounts, skipCount, minCount, maxCount, topTieCount);

		// 7) topVotedId (지목된 시민)
		final Long topVotedId = skipFlag
			? null
			: voteCounts.entrySet().stream()
			.max(Map.Entry.comparingByValue())
			.map(Map.Entry::getKey)
			.orElse(null);

		// 8) “시민이 라이어를 찾았는지”
		boolean citizenFoundLiar = (topVotedId != null && topVotedId.equals(liarId));

		// 9) 점수 부여
		Winner winner = (citizenFoundLiar && !isCorrect) ? Winner.civil : Winner.liar;
		applyScores(winner, citizenFoundLiar, isCorrect, civPRs, liarPR, prList, topVotedId);

		round.setWinner(winner);
		participantRoundRepository.saveAll(prList);

		String nickname = SecurityUtils.getCurrentNickname();
		String socketMessage = formatGuessMessage(nickname, req.guessText(), isCorrect);
		chatSocketService.guessSubmitted(roomCode, socketMessage);

		return new GuessResponseDto(isCorrect, winner.name());
	}

	private boolean checkAnswer(Round round, GuessRequestDto req) {
		String targetWord = round.getWord1();
		String normalizedInput  = req.guessText().replaceAll("\\s+", "").toLowerCase();
		String normalizedAnswer  = targetWord.replaceAll("\\s+", "").toLowerCase();
		boolean isCorrect = normalizedInput.equals(normalizedAnswer);

		if (!isCorrect) {
			Optional<CategoryWord> cwOpt = categoryWordRepository.findByWordIgnoreCase(targetWord);
			if (cwOpt.isPresent()) {
				List<Synonym> syns = synonymRepository.findByMainWord(cwOpt.get());
				for (Synonym s : syns) {
					String normSyn = s.getSynonym().replaceAll("\\s+", "").toLowerCase();
					if (normalizedInput.equals(normSyn)) {
						isCorrect = true;
						break;
					}
				}
			}
		}

		return isCorrect;
	}

	private boolean checkSkipFlag(List<Integer> nonSkipCounts, int skipCount, int minCount, int maxCount, long topTieCount) {
		if (nonSkipCounts.isEmpty()) {
			return true;
		} else if (skipCount >= maxCount) {
			return true;
		} else if (topTieCount > 1) {
			return true;
		} else {
			return false;
		}
	}

	private void applyScores(Winner winner, boolean citizenFoundLiar, boolean isCorrect,
		List<ParticipantRound> civPRs, ParticipantRound liarPR, List<ParticipantRound> prList, Long topVotedId) {
		if (winner == Winner.civil) {
			// ▶ 시민 승리
			civPRs.forEach(pr -> pr.addScore(100));
		} else {
			// ▶ 라이어 승리
			if (citizenFoundLiar && isCorrect) {
				liarPR.addScore(100);
				civPRs.forEach(pr -> pr.addScore(-100));
			} else if (!citizenFoundLiar && isCorrect) {
				civPRs.forEach(pr -> pr.addScore(-100));
				liarPR.addScore(200);
				prList.stream()
					.filter(pr -> pr.getParticipant().getId().equals(topVotedId))
					.forEach(pr -> pr.addScore(-100));
			} else {
				civPRs.forEach(pr -> pr.addScore(-100));
				liarPR.addScore(100);
				prList.stream()
					.filter(pr -> pr.getParticipant().getId().equals(topVotedId))
					.forEach(pr -> pr.addScore(-100));
			}
		}
	}

	private String formatGuessMessage(String nickname, String guessText, boolean isCorrect) {
		String resultText = isCorrect ? "정답" : "오답";
		return String.format("%s! %s님이 %s(을)를 제출했습니다.", resultText, nickname, guessText);
	}

	@Transactional(readOnly = true)
	public ScoresResponseDto getScores(String roomCode) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		List<Round> rounds = roundRepository.findByRoom(room);

		Map<String, Integer> scoreMap = new HashMap<>();
		List<ParticipantRound> allPRs = new ArrayList<>();
		for (Round r : rounds) {
			participantRoundRepository.findByRound(r).stream()
				.filter(pr -> pr.getParticipant().isActive())
				.forEach(pr -> {
					String nick = pr.getParticipant().getSession().getNickname();
					scoreMap.put(nick, scoreMap.getOrDefault(nick, 0) + pr.getScore());
				});
		}

		List<ScoresResponseDto.ScoreEntry> entries = scoreMap.entrySet().stream()
			.map(e -> new ScoresResponseDto.ScoreEntry(e.getKey(), e.getValue()))
			.sorted(Comparator.comparingInt(ScoresResponseDto.ScoreEntry::totalScore).reversed())
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
	public TurnUpdateResponse updateTurn(TurnUpdateRequestDto req) {
		Room room = roomRepository.findByRoomCode(req.roomCode())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		Round round = roundRepository.findByRoomAndRoundNumber(room, req.roundNumber())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		round.incrementTurn();
		participantRoundRepository.resetHasVotedByRound(round);

		roundRepository.save(round);

		lastNotifiedTurn.remove(round.getId());

		return new TurnUpdateResponse(round.getTurn());
	}

	@Transactional(readOnly = true)
	public ScoresResponseDto getCurrentRoundScores(String roomCode) {
		// 1) 방 조회
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		// 2) 최신 라운드 조회
		Round latestRound = roundRepository
			.findTopByRoomOrderByRoundNumberDesc(room)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		// 3) ParticipantRound 목록(Fetch join 으로 세션까지 한 번에)
		List<ParticipantRound> prs = participantRoundRepository
			.findByRoundWithParticipantSession(latestRound);

		// 4) DTO 변환
		List<ScoresResponseDto.ScoreEntry> entries = prs.stream()
			.map(pr -> new ScoresResponseDto.ScoreEntry(
				pr.getParticipant().getSession().getNickname(),
				pr.getScore()
			))
			.collect(Collectors.toList());

		return new ScoresResponseDto(entries);
	}

	@Transactional(readOnly = true)
	public WordResponseDto getCurrentRoundWords(String roomCode) {
		// 1) 방 객체 조회
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		// 2) 최신 라운드 조회
		Round latestRound = roundRepository
			.findTopByRoomOrderByRoundNumberDesc(room)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		// 3) DTO 리턴
		return new WordResponseDto(latestRound.getWord1(), latestRound.getWord2());
	}
}
