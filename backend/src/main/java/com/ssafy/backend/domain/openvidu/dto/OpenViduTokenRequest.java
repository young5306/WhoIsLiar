package com.ssafy.backend.domain.openvidu.dto;

import lombok.Getter;

@Getter
public class OpenViduTokenRequest {
	private String roomId;
	private String nickname;
}
