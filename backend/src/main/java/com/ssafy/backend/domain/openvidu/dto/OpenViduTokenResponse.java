package com.ssafy.backend.domain.openvidu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
public class OpenViduTokenResponse {
	private String sessionId;
	private String token;
}
