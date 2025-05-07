package com.ssafy.backend.domain.round.entity;

import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.global.enums.RoundStatus;
import com.ssafy.backend.global.enums.Winner;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "rounds")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Round {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "room_id", nullable = false)
	private Room room;

	@Column(name = "round_number", nullable = false)
	private int roundNumber;

	@Column(nullable = true, length = 50)
	private String word1;

	@Column(nullable = true, length = 50)
	private String word2;

	@Enumerated(EnumType.STRING)
	@Column(name = "round_status", nullable = false, length = 20)
	private RoundStatus roundStatus;

	@Enumerated(EnumType.STRING)
	@Column(length = 10)
	private Winner winner;

	@Column(name = "turn", nullable = false)
	private int turn;

	@Column(name = "created_at", nullable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	@Builder
	public Round(Room room, int roundNumber, String word1, String word2, RoundStatus roundStatus, Winner winner,
		int turn, LocalDateTime createdAt, LocalDateTime updatedAt) {
		this.room = room;
		this.roundNumber = roundNumber;
		this.word1 = word1;
		this.word2 = word2;
		this.roundStatus = roundStatus;
		this.winner = winner;
		this.turn = turn;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	public void setWinner(Winner winner) {
		this.winner = winner;
		this.updatedAt = LocalDateTime.now();
	}

	public void incrementTurn() {
		this.turn++;
		this.updatedAt = LocalDateTime.now();
	}
}
