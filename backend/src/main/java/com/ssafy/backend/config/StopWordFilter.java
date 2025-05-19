package com.ssafy.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import jakarta.annotation.PostConstruct;

@Component
public class StopWordFilter {

	/** application.yml 에 정의한 리소스 경로 */
	@Value("${app.stopwords-file}")
	private Resource stopwordsResource;

	/** 컴파일된 금칙어 패턴 (CASE_INSENSITIVE) */
	private Pattern pattern;

	@jakarta.annotation.PostConstruct
	public void init() throws IOException {
		// 1) 리소스에서 한 줄씩 읽어서, 빈 줄·주석(#) 제외
		List<String> stopWords;
		try (BufferedReader reader = new BufferedReader(
			new InputStreamReader(stopwordsResource.getInputStream(), StandardCharsets.UTF_8)
		)) {
			stopWords = reader.lines()
				.map(String::trim)
				.filter(line -> !line.isEmpty() && !line.startsWith("#"))
				.collect(Collectors.toList());
		}

		String joined = stopWords.stream()
			.map(Pattern::quote)
			.collect(Collectors.joining("|"));

		pattern = Pattern.compile(joined, Pattern.CASE_INSENSITIVE);
	}

	/**
	 * 입력 텍스트에서 금칙어를 찾아 동일 길이의 '*' 로 마스킹하여 반환
	 */
	public String censor(String text) {
		if (text == null || pattern == null) {
			return text;
		}

		Matcher m = pattern.matcher(text);
		StringBuffer sb = new StringBuffer();
		while (m.find()) {
			String word = m.group();
			// Java 11+: String.repeat
			m.appendReplacement(sb, "*".repeat(word.length()));
		}
		m.appendTail(sb);
		return sb.toString();
	}
}
