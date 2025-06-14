package com.ssafy.backend.domain.participant.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.ssafy.backend.domain.round.entity.Round;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "participants_rounds")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ParticipantRound {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "participant_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Participant participant;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "round_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Round round;

	@Column(name = "`order`", nullable = false)
	private int order;

	@Column(name = "is_liar", nullable = false)
	private boolean isLiar;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "target_participant_id")
	private Participant targetParticipant;

	@Column(name = "has_voted", nullable = false)
	@ColumnDefault("false")
	private boolean hasVoted;

	@Column(nullable = false)
	private int score = 0;

	@Column(name = "created_at", nullable = false)
	private LocalDateTime createdAt;

	@Builder
	public ParticipantRound(Participant participant, Round round, int order, boolean isLiar,
		Participant targetParticipant, boolean hasVoted, int score, LocalDateTime createdAt) {
		this.participant = participant;
		this.round = round;
		this.order = order;
		this.isLiar = isLiar;
		this.targetParticipant = targetParticipant;
		this.hasVoted = hasVoted;
		this.score = score;
		this.createdAt = createdAt;
	}

	public void voteTargetParticipant(Participant targetParticipant) {
		this.targetParticipant = targetParticipant;
		this.hasVoted = true;
	}

	public void addScore(int delta) {
		this.score += delta;
	}
}
