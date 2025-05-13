package com.ssafy.backend.domain.round.service;

import com.ssafy.backend.domain.chat.service.ChatSocketService;
import com.ssafy.backend.domain.participant.entity.ParticipantRound;
import com.ssafy.backend.domain.participant.repository.ParticipantRoundRepository;
import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.domain.room.repository.RoomRepository;
import com.ssafy.backend.domain.round.entity.Round;
import com.ssafy.backend.domain.round.repository.RoundRepository;
import com.ssafy.backend.global.enums.ResponseCode;
import com.ssafy.backend.global.exception.CustomException;
import com.ssafy.backend.global.util.SecurityUtils;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class TurnTimerService {

	private final RoomRepository roomRepository;
	private final RoundRepository roundRepository;
	private final ParticipantRoundRepository participantRoundRepository;
	private final ChatSocketService chatSocketService;
	private final TurnExecutionService turnExecutionService;

	private final ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
	private final Map<String, TurnState> turnMap = new ConcurrentHashMap<>();
	private static final int TURN_DURATION_SECONDS = 20;
	private static final int TURN_DELAY_SECONDS = 3;

	@PostConstruct
	public void init() {
		scheduler.setPoolSize(10);
		scheduler.setThreadNamePrefix("TurnTimer-");
		scheduler.initialize();
	}

	public void startTurnSequence(String roomCode, int roundNumber) {
		if (turnMap.containsKey(roomCode)) {
			log.warn("이미 실행 중인 타이머가 있습니다: roomCode={}", roomCode);
			return;
		}

		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
		Round round = roundRepository.findByRoomAndRoundNumber(room, roundNumber)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
		List<ParticipantRound> turnList =
			participantRoundRepository.findByRoundWithParticipantSession(round);
		if (turnList.isEmpty()) throw new CustomException(ResponseCode.NOT_FOUND);

		TurnState state = new TurnState(roundNumber, turnList, 0, null);
		turnMap.put(roomCode, state);

		startNextTurn(roomCode, state); // 첫 턴은 즉시 시작
	}

	public void endTurn(String roomCode) {
		TurnState state = turnMap.get(roomCode);
		if (state != null && state.getFuture() != null) {
			state.getFuture().cancel(false);
			state.setIndex(state.getIndex() + 1);
			chatSocketService.sendTurnSkip(roomCode, SecurityUtils.getCurrentNickname());
			proceedToNextTurn(roomCode);
		}
	}

	public void proceedToNextTurn(String roomCode) {
		TurnState state = turnMap.get(roomCode);
		if (state == null) return;

		if (state.getIndex() >= state.getTurns().size()) {
			chatSocketService.roundFullyEnded(roomCode);
			turnMap.remove(roomCode);
			return;
		}

		// 이후 턴부터는 3초 대기
		scheduler.schedule(() -> startNextTurn(roomCode, state), Instant.now().plusSeconds(TURN_DELAY_SECONDS));
	}

	private void startNextTurn(String roomCode, TurnState state) {
		Room room = roomRepository.findByRoomCode(roomCode)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
		Round round = roundRepository.findByRoomAndRoundNumber(room, state.getRoundNumber())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		List<ParticipantRound> turnList =
			participantRoundRepository.findByRoundWithParticipantSession(round);

		if (state.getIndex() >= turnList.size()) {
			chatSocketService.roundFullyEnded(roomCode);
			turnMap.remove(roomCode);
			return;
		}

		ParticipantRound current = turnList.get(state.getIndex());
		Long participantRoundId = current.getId();
		int currentIndex = state.getIndex();

		ScheduledFuture<?> future = scheduler.schedule(() -> {
			try {
				turnExecutionService.executeTurn(roomCode, participantRoundId, currentIndex, state, this);
			} catch (Exception e) {
				log.error("턴 진행 중 에러 발생: roomCode={}, error={}", roomCode, e.getMessage(), e);
			}
		}, Instant.now().plusSeconds(TURN_DURATION_SECONDS));

		state.setFuture(future);

		String nickname = current.getParticipant().getSession().getNickname();
		chatSocketService.sendTurnStart(roomCode, nickname, TURN_DURATION_SECONDS);
	}

	public void cancelTurnSequence(String roomCode) {
		TurnState state = turnMap.remove(roomCode);
		if (state != null && state.getFuture() != null) {
			state.getFuture().cancel(false);
			log.info("TurnTimerService: roomCode={} 타이머 취소", roomCode);
		}
	}

	@PreDestroy
	public void shutdown() {
		log.info("TurnTimerService 종료. 타이머 중지.");
		scheduler.shutdown();
	}

	public static void updateStateAndProceed(String roomCode, int currentIndex, TurnState state, TurnTimerService service) {
		if (state != null && state.getIndex() == currentIndex) {
			state.setIndex(currentIndex + 1);
			service.proceedToNextTurn(roomCode);
		}
	}

	public static class TurnState {
		private int roundNumber;
		private final List<ParticipantRound> turns;
		private int index;
		private ScheduledFuture<?> future;

		public TurnState(int roundNumber, List<ParticipantRound> turns, int index, ScheduledFuture<?> future) {
			this.roundNumber = roundNumber;
			this.turns = turns;
			this.index = index;
			this.future = future;
		}

		public int getRoundNumber() {return roundNumber;}
		public List<ParticipantRound> getTurns() { return turns; }
		public int getIndex() { return index; }
		public ScheduledFuture<?> getFuture() { return future; }

		public void setIndex(int index) { this.index = index; }
		public void setFuture(ScheduledFuture<?> future) { this.future = future; }
	}
}
