package com.ssafy.backend.domain.chat.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.backend.domain.chat.dto.ChatSummaryRequestDto;
import com.ssafy.backend.domain.chat.service.ChatService;
import com.ssafy.backend.global.common.CommonResponse;
import com.ssafy.backend.global.common.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/chat")
@Validated
@RequiredArgsConstructor
@Tag(name = "Chat", description = "채팅 관련 API")
public class ChatController {
	private final ChatService chatService;

	@Operation(summary = "음성 텍스트 요약 저장",
		description = "RequestBody로 전달된 speech 내용을 GPT로 요약한 후 데이터베이스에 저장합니다.")
	@PostMapping("/speech/summary")
	public ResponseEntity<CommonResponse<Void>> summarizeSpeech(
		@Valid @RequestBody ChatSummaryRequestDto request
	) {
		chatService.summarizeAndSave(request);
		return ResponseUtil.created(null);
	}
}
