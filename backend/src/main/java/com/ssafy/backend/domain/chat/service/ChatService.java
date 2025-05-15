package com.ssafy.backend.domain.chat.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ssafy.backend.domain.auth.repository.SessionRepository;
import com.ssafy.backend.domain.chat.dto.ChatSummaryRequestDto;
import com.ssafy.backend.domain.chat.entity.Chat;
import com.ssafy.backend.domain.chat.repository.ChatRepository;
import com.ssafy.backend.domain.participant.entity.Participant;
import com.ssafy.backend.domain.participant.repository.ParticipantRepository;
import com.ssafy.backend.global.enums.ChatType;
import com.ssafy.backend.global.enums.ResponseCode;
import com.ssafy.backend.global.exception.CustomException;
import com.ssafy.backend.global.util.SecurityUtils;
import com.ssafy.backend.integration.gpt.GptService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatService {
	private final GptService gptService;
	private final SessionRepository sessionRepository;
	private final ParticipantRepository participantRepository;
	private final ChatRepository chatRepository;
	private final ChatSocketService chatSocketService;

	@Transactional
	public void summarizeAndSave(ChatSummaryRequestDto request) {
		// 1) 현재 로그인 사용자 조회
		String nickname = SecurityUtils.getCurrentNickname();
		var session = sessionRepository.findByNickname(nickname)
			.orElseThrow(() -> new CustomException(ResponseCode.UNAUTHORIZED));

		// 2) 사용자가 활성 상태(isActive=true)인 방 참가 정보 조회
		Participant participant = participantRepository.findBySessionAndActive(session)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		// 3) GPT로 요약 생성
		String summary = gptService.getSummary(request.getSpeech());

		// 4) Chat 엔티티로 저장
		Chat chat = Chat.builder()
			.room(participant.getRoom())
			.sender(session)
			.chat(summary)
			.chatType(ChatType.HINT)
			.createdAt(LocalDateTime.now())
			.build();

		chatRepository.save(chat);

		chatSocketService.sendHint(participant.getRoom().getRoomCode(), SecurityUtils.getCurrentNickname(), summary);
	}
}
