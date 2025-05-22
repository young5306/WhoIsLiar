package com.ssafy.backend.domain.openvidu.controller;

import static com.ssafy.backend.global.common.ResponseUtil.*;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.backend.domain.openvidu.dto.OpenViduTokenResponse;
import com.ssafy.backend.domain.openvidu.service.OpenViduService;
import com.ssafy.backend.global.common.CommonResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/openvidu")
public class OpenViduController {

	private final OpenViduService sessionService;

	@PostMapping("/sessions/{roomCode}")
	public ResponseEntity<CommonResponse<OpenViduTokenResponse>> join(@PathVariable String roomCode) {
		OpenViduTokenResponse response = sessionService.joinSession(roomCode);
		return ok(response);
	}
}
