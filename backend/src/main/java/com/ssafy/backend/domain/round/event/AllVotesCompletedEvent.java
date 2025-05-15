package com.ssafy.backend.domain.round.event;

public class AllVotesCompletedEvent {
	private final String roomCode;
	private final Long roundId;

	public AllVotesCompletedEvent(String roomCode, Long roundId) {
		this.roomCode = roomCode;
		this.roundId = roundId;
	}

	public String getRoomCode() {
		return roomCode;
	}

	public Long getRoundId() {
		return roundId;
	}
}
