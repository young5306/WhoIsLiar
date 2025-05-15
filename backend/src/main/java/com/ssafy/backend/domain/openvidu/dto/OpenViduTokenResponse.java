package com.ssafy.backend.domain.openvidu.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OpenViduTokenResponse {
	private String sessionId;
	private String token;
}
