package com.ssafy.backend.domain.openvidu.controller;

import java.util.Map;

import com.ssafy.backend.domain.openvidu.dto.OpenViduTokenRequest;
import com.ssafy.backend.domain.openvidu.dto.OpenViduTokenResponse;
import com.ssafy.backend.domain.openvidu.service.OpenViduService;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/openvidu")
public class OpenViduController {

    private final OpenViduService sessionService;

    @PostMapping("/sessions")
    public ResponseEntity<OpenViduTokenResponse> join(@RequestBody OpenViduTokenRequest request) throws Exception {
        String roomCode = request.getRoomCode();

        OpenViduTokenResponse response = sessionService.joinSession(roomCode);
        return ResponseEntity.ok(response);
    }
}
