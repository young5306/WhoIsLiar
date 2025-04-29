package com.ssafy.backend.domain.openvidu.controller;

import com.ssafy.backend.domain.openvidu.service.OpenViduService;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/openvidu")
@RequiredArgsConstructor
public class OpenViduController {

    private final OpenViduService openViduService;

    @PostMapping("/session")
    public String createSession(@RequestParam(required = false) String customSessionId)
            throws OpenViduJavaClientException, OpenViduHttpException {
        return openViduService.createSession(customSessionId);
    }

    @PostMapping("/token")
    public String createToken(@RequestParam String sessionId, @RequestParam String clientData)
            throws OpenViduJavaClientException, OpenViduHttpException {
        return openViduService.createToken(sessionId, clientData);
    }
}