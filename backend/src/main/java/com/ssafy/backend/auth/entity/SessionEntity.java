package com.ssafy.backend.auth.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Setter
@Getter
@Table(name = "sessions")
public class SessionEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** 클라이언트에 발급할 랜덤 토큰 */
	@Column(unique = true, nullable = false)
	private String token;

	/** 중복 닉네임 방지를 위해 unique */
	@Column(unique = true, nullable = false)
	private String nickname;

	@Column(nullable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime lastActiveAt;

	// 기본 생성자 및 getter/setter 생략
}