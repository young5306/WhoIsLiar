package com.ssafy.backend.domain.chat.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.global.enums.ChatType;

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
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "chats")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Chat {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "room_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Room room;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "sender_id")
	@OnDelete(action = OnDeleteAction.CASCADE)
	private SessionEntity sender;

	@Column(nullable = false, length = 255)
	private String chat;

	@Enumerated(EnumType.STRING)
	@Column(name = "chat_type", nullable = false, length = 20)
	private ChatType chatType;

	@Column(name = "created_at", nullable = false)
	private LocalDateTime createdAt;

	@Builder
	public Chat(Room room, SessionEntity sender, String chat, ChatType chatType, LocalDateTime createdAt) {
		this.room = room;
		this.sender = sender;
		this.chat = chat;
		this.chatType = chatType;
		this.createdAt = createdAt;
	}
}
