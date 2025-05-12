package com.ssafy.backend.integration.gpt;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;

@Service
public class GptService {
	private final WebClient webClient;

	@Value("${openai.api-key}")
	private String apiKey;

	public GptService(WebClient.Builder builder) {
		this.webClient = builder
			.baseUrl("https://api.openai.com/v1")
			.defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
			.build();
	}

	public String getSimilarWord(String word, String category) {
		var messages = List.of(
			Map.of(
				"role", "system",
				"content", "당신은 라이어게임의 단어 선정 도우미입니다. " +
					"현재 카테고리는 '" + category + "' 입니다. " +
					"사용자가 라이어게임에서 헷갈릴만한 단어 하나만 추천해주세요."
			),
			Map.of(
				"role", "user",
				"content",
				"카테고리 '" + category + "' 에 맞춰, 다음 단어와 라이어가 헷갈릴 수 있는" +
					"어렵지 않은 일상 생활에서 많이 쓰이는 단어 하나만 한국어로 추천해줘: " + word + ". 단어 하나만 말해주면 돼. 다른말 하지말고"
			)
		);

		var requestBody = Map.<String, Object>of(
			"model", "gpt-4o",
			"messages", messages,
			"max_tokens", 10
		);

		JsonNode resp = webClient.post()
			.uri("/chat/completions")
			.header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
			.bodyValue(requestBody)
			.retrieve()
			.bodyToMono(JsonNode.class)
			.block();

		return resp
			.path("choices").get(0)
			.path("message").path("content")
			.asText().trim();
	}

	public String getSummary(String speech) {
		var messages = List.of(
			// Map.of("role", "system", "content", "당신은 라이어게임의 음성 요약 도우미입니다."),
			// Map.of("role", "user",   "content", "다음 음성 내용을 간결하게 요약해줘. 핵심 내용 문장만 짧고 간단하게. 누가말했는지는 필요없으니까 핵심 내용만. 마치 채팅 친거처럼 간단한 '입니다' 위주의 전달.: " + speech)
			Map.of("role", "system", "content", "당신은 주어진 텍스트에서 핵심적인 힌트를 뽑아내는 전문가입니다."),
			Map.of("role", "user",   "content", "주어지는 텍스트는 라이어 게임의 참가자들이 발언한 내용입니다.\n"
				+ "텍스트 속에서 힌트를 추출하고, 힌트만 대답해주세요.\n"
				+ "(예시: \"이건 밝은 색이야.\", \"주로 밤에 사용되는 물건이야.\")" + "텍스트 : "+speech)
		);

		var requestBody = Map.<String, Object>of(
			"model",      "gpt-4o",
			"messages",   messages,
			"max_tokens", 100
		);

		JsonNode resp = webClient.post()
			.uri("/chat/completions")
			.header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
			.bodyValue(requestBody)
			.retrieve()
			.bodyToMono(JsonNode.class)
			.block();

		return resp
			.path("choices").get(0)
			.path("message").path("content")
			.asText().trim();
	}
}
