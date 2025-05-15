package com.ssafy.backend.domain.round.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.ssafy.backend.domain.participant.entity.ParticipantRound;
import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.global.enums.RoundStatus;
import com.ssafy.backend.global.enums.Winner;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
	@OnDelete(action = OnDeleteAction.CASCADE)
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

	@OneToMany(mappedBy = "round", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<ParticipantRound> participantRounds = new ArrayList<>();

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
