package com.ssafy.backend.global.config;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

@Configuration
public class ValidationConfig {
	/** 메시지 파일 로딩: messages.properties */
	@Bean
	public MessageSource messageSource() {
		var ms = new ReloadableResourceBundleMessageSource();
		ms.setBasename("classpath:messages");
		ms.setDefaultEncoding("UTF-8");
		ms.setFallbackToSystemLocale(false);
		return ms;
	}

	/** Validator가 위 MessageSource를 사용하도록 설정 */
	@Bean
	public LocalValidatorFactoryBean validator(MessageSource messageSource) {
		var vb = new LocalValidatorFactoryBean();
		vb.setValidationMessageSource(messageSource);
		return vb;
	}
}
