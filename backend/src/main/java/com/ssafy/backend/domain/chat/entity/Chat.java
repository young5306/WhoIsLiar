package com.ssafy.backend.domain.chat.entity;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.global.enums.ChatType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

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
	private Room room;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "sender_id")
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
