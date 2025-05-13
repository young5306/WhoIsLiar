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
			Map.of("role", "system", "content", "당신은 주어진 텍스트에서 핵심적인 힌트를 뽑아내는 전문가입니다."),
			Map.of("role", "user", "content",
				"주어지는 텍스트는 라이어 게임 참가자들의 발언이며, 그 안에서 명확하게 드러나는 힌트 문장만 추출하세요.\n" +
					"다음 조건을 반드시 지키세요:\n\n" +
					"의역하지 말고, 원문에서 드러나는 표현만 힌트로 간주합니다.\n\n" +
					"힌트는 순수 텍스트 한 문장으로 출력합니다.\n\n" +
					"\"힌트 :\", 따옴표(\"\"), 번호, 괄호 등 어떠한 장식도 붙이지 말고, 힌트만 출력하세요.\n\n" +
					"힌트는 15자 이하여야 하며, 초과할 경우 출력하지 마세요.\n\n" +
					"힌트가 명확하지 않거나, 조건에 맞는 문장이 없으면 아무 것도 출력하지 마세요.\n\n" +
					"예시 출력:\n" +
					"밝은 색이야.\n" +
					"소리가 커.\n" +
					"밤에 쓰는 물건이야.\n\n" +
					"텍스트 : " + speech)
		);

		var requestBody = Map.<String, Object>of(
			"model", "gpt-4o",
			"messages", messages,
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
