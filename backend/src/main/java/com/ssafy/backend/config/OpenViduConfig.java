package com.ssafy.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.openvidu.java.client.OpenVidu;

@Configuration
public class OpenViduConfig {

	@Value("${openvidu.url}")
	private String openviduUrl;

	@Value("${openvidu.secret}")
	private String openviduSecret;

	@Bean
	public OpenVidu openVidu() {
		return new OpenVidu(openviduUrl, openviduSecret);
	}
}