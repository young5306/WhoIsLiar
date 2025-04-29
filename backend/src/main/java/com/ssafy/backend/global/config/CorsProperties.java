// src/main/java/com/ssafy/backend/global/config/CorsProperties.java
package com.ssafy.backend.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConfigurationProperties(prefix = "cors")
public class CorsProperties {
	/**
	 * application-*.yml 의 cors.allowed-origins: 아래 리스트를 바인딩
	 */
	private List<String> allowedOrigins;

	public List<String> getAllowedOrigins() {
		return allowedOrigins;
	}
	public void setAllowedOrigins(List<String> allowedOrigins) {
		this.allowedOrigins = allowedOrigins;
	}
}
