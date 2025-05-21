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
			"당신은 한국어 대화에서 ‘음’, ‘어’, ‘저기’, ‘그런데’, ‘있잖아’ 등 의미 없는 추임새만 깔끔히 제거하는 언어 처리 전문가입니다.\n" +
			"다음 발화에서 불필요한 추임새를 모두 삭제하고, 나머지 문장은 원문 그대로 유지하여 출력하세요.\n\n" +
			"입력:\n\"%s\"\n\n" +
			"출력:", speech
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

	public boolean isSynonym(String mainWord, String guess, String category) {
		String normMain = mainWord.replaceAll("\\s+", "").toLowerCase();
		String normGuess = guess.replaceAll("\\s+", "").toLowerCase();

		String systemPrompt = "당신은 라이어게임 단어 매칭 전문가입니다.";
		String userPrompt = String.format(
			"카테고리 '%s'의 단어 '%s'와 사용자가 제출한 '%s'가" +
				" 의미상으로 같거나 동의어라면 'yes', 아니면 'no'만 출력하세요.",
			category, normMain, normGuess
		);

		var messages = List.of(
			Map.of("role", "system", "content", systemPrompt),
			Map.of("role", "user", "content", userPrompt)
		);

		var requestBody = Map.<String, Object>of(
			"model", "gpt-4o",
			"messages", messages,
			"max_tokens", 5,
			"temperature", 0.0,
			"top_p", 1.0
		);

		JsonNode resp = webClient.post()
			.uri("/chat/completions")
			.header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
			.bodyValue(requestBody)
			.retrieve()
			.bodyToMono(JsonNode.class)
			.block();

		String answer = resp
			.path("choices").get(0)
			.path("message").path("content")
			.asText().trim();

		return "yes".equalsIgnoreCase(answer);
	}
}
