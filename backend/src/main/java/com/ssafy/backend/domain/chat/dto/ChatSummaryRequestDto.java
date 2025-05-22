package com.ssafy.backend.domain.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatSummaryRequestDto {
	@NotBlank(message = "요약할 텍스트를 입력하세요.")
	private String speech;
}
