package com.ssafy.backend.domain.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ssafy.backend.domain.chat.entity.Chat;

public interface ChatRepository extends JpaRepository<Chat, Long> {
}
