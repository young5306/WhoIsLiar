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
		String prompt = String.format(
			"당신은 라이어 게임 참가자의 발언에서 핵심적인 힌트를 추출하는 전문가입니다.\n\n" +
				"입력으로 주어지는 텍스트는 참가자의 대화 내용이며, 그 중에서 사물의 속성, 용도, 특징, 감각 등을 설명하는 문장을 찾아 출력하세요.\n\n" +
				"다음 조건을 반드시 지키세요:\n" +
				"- 의역하지 말고, 원문에서 드러나는 표현만 간결한 문장으로 출력합니다.\n" +
				"- 의미가 다르면 줄바꿈하여 여러 문장을 출력해도 됩니다.\n" +
				"- 힌트는 반드시 사물의 속성, 용도, 색상, 촉감, 감각 등만 설명해야 합니다.\n" +
				"- 전략, 감정, 심리, 인물 평가, 팀워크와 관련된 문장은 무시하세요.\n" +
				"- 출력 시 따옴표, 번호, 괄호, \"힌트:\" 같은 장식 없이 순수한 문장만 출력하세요.\n" +
				"- 조건에 맞는 힌트가 없다면 아무 것도 출력하지 마세요.\n\n" +
				"예시 입력:\n" +
				"이건 맛있어. 주로 여름에 생각나.\n\n" +
				"예시 출력:\n" +
				"맛있어.\n" +
				"주로 여름에 생각나.\n\n" +
				"다음 텍스트를 분석하세요:\n" +
				"텍스트: %s", speech
		);

		var messages = List.of(
			Map.of("role", "user", "content", prompt)
		);

		var requestBody = Map.<String, Object>of(
			"model", "gpt-4o",
			"messages", messages,
			"max_tokens", 100,
			"temperature", 0.2,
			"top_p", 1.0,
			"frequency_penalty", 0.0,
			"presence_penalty", 0.0
		);

		JsonNode resp = webClient.post()
			.uri("/chat/completions")
			.header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
			.bodyValue(requestBody)
			.retrieve()
			.bodyToMono(JsonNode.class)
			.block();

		String raw = resp
			.path("choices").get(0)
			.path("message").path("content")
			.asText().trim();

		String cleaned = raw
			.replaceAll("[\\u0000-\\u001F\\u007F\\u2028\\u2029\\u200B]", "")
			.replaceAll("[\\p{Cf}]", "")
			.trim();

		return cleaned;
	}
}
