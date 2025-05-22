package com.ssafy.backend.domain.round.event;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.ssafy.backend.domain.round.service.RoundService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class VoteScoringListener {
	private final RoundService roundService;

	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	public void onAllVotesCompleted(AllVotesCompletedEvent event) {
		roundService.checkAndNotifyVoteCompleted(
			event.getRoomCode(),
			event.getRoundId()
		);
	}
}