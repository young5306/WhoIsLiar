package com.ssafy.backend.global.aop;

import java.util.Arrays;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

@Aspect
@Component
@Order(0)
public class ControllerLoggingAspect {

	private static final Logger logger = LoggerFactory.getLogger(ControllerLoggingAspect.class);
	private final ObjectMapper objectMapper;

	public ControllerLoggingAspect(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	@Pointcut("within(@org.springframework.web.bind.annotation.RestController *)")
	public void restControllerMethods() {}

	@Around("restControllerMethods()")
	public Object logController(ProceedingJoinPoint joinPoint) throws Throwable {
		String methodName = joinPoint.getSignature().getName();
		Object[] args = joinPoint.getArgs();

		// 요청 로그
		logger.info("[컨트롤러 REQUEST] ==============================");
		logger.info("▷ Controller Method: {}", methodName);
		logger.info("▷ Request Params: {}", Arrays.toString(args));

		// 실제 컨트롤러 실행
		Object result = joinPoint.proceed();

		// 응답 로그
		logger.info("[컨트롤러 RESPONSE]");
		logger.info("▷ Controller Method: {}", methodName);

		if (result instanceof ResponseEntity) {
			ResponseEntity<?> resp = (ResponseEntity<?>) result;

			// 1) 상태 코드
			logger.info("▷ Response Status: {}", resp.getStatusCode());

			// 2) body (CommonResponse) 내부 JSON
			Object body = resp.getBody();
			try {
				String json = objectMapper.writeValueAsString(body);
				logger.info("▷ Response Body: {}", json);
			} catch (Exception e) {
				// 직렬화 에러 날 경우 toString() 으로라도 찍어 줌
				logger.info("▷ Response Body (toString): {}", body);
			}

		} else {
			// ResponseEntity 가 아니면 기존 방식 유지
			logger.info("▷ Response Value: {}", result);
		}

		logger.info("================================================");
		return result;
	}
}
