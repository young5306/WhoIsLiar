package com.ssafy.backend.domain.room.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.chat.entity.Chat;
import com.ssafy.backend.domain.participant.entity.Participant;
import com.ssafy.backend.domain.round.entity.Round;
import com.ssafy.backend.global.enums.Category;
import com.ssafy.backend.global.enums.GameMode;
import com.ssafy.backend.global.enums.RoomStatus;
import com.ssafy.backend.global.enums.VideoMode;

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
@Table(name = "rooms")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Room {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "host_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private SessionEntity session;

	@Column(name = "room_code", nullable = false, unique = true)
	private String roomCode;

	@Column(name = "room_name", nullable = false)
	private String roomName;

	@Column(length = 50)
	private String password;

	@Column(name = "round_count", nullable = false)
	private int roundCount;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private GameMode gameMode;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private VideoMode videoMode;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Category category = Category.랜덤;

	@Enumerated(EnumType.STRING)
	@Column(name = "room_status", nullable = false, length = 10)
	private RoomStatus roomStatus = RoomStatus.waiting;

	@Column(name = "created_at", nullable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	@OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Participant> participants = new ArrayList<>();

	@OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Round> rounds = new ArrayList<>();

	@OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Chat> chats = new ArrayList<>();

	@Builder
	public Room(SessionEntity session, String roomCode, String roomName, String password, int roundCount,
		GameMode gameMode, VideoMode videoMode, RoomStatus roomStatus,
		LocalDateTime createdAt, LocalDateTime updatedAt) {
		this.session = session;
		this.roomCode = roomCode;
		this.roomName = roomName;
		this.password = password;
		this.roundCount = roundCount;
		this.gameMode = gameMode;
		this.videoMode = videoMode;
		this.roomStatus = roomStatus;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	public void startGame(RoomStatus roomStatus) {
		this.roomStatus = roomStatus;
		this.updatedAt = LocalDateTime.now();
	}

	public void selectCategory(Category category) {
		this.category = category;
		this.updatedAt = LocalDateTime.now();
	}

	public void changeHost(SessionEntity session) {
		this.session = session;
		this.updatedAt = LocalDateTime.now();
	}

	public void finishGame(RoomStatus roomStatus) {
		this.roomStatus = roomStatus;
		this.updatedAt = LocalDateTime.now();
	}
}
