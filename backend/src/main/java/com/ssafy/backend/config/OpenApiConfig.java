package com.ssafy.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;

import java.util.List;

@Configuration
public class OpenApiConfig {

	@Bean
	public OpenAPI backendOpenAPI() {
		return new OpenAPI()
				.info(new Info()
						.title("Liar Game : 믿지마! - API")
						.version("v1.0.0")
						.description("API 문서")
						.license(new License()
								.name("Apache 2.0")
								.url("https://www.apache.org/licenses/LICENSE-2.0.html")
						)
				)
				.servers(List.of(
						new Server()
								.url("https://whoisliar.me")
								.description("Prod"),
						new Server()
								.url("http://localhost:8080")
								.description("Local")
				));
	}
}
