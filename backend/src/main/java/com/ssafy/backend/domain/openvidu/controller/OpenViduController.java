package com.ssafy.backend.domain.openvidu.controller;

import com.ssafy.backend.domain.openvidu.dto.OpenViduTokenResponse;
import com.ssafy.backend.domain.openvidu.service.OpenViduService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/openvidu")
public class OpenViduController {

    private final OpenViduService sessionService;

    @PostMapping("/sessions/{roomCode}")
    public ResponseEntity<OpenViduTokenResponse> join(@PathVariable String roomCode) throws Exception {
        OpenViduTokenResponse response = sessionService.joinSession(roomCode);
        return ResponseEntity.ok(response);
    }
}
