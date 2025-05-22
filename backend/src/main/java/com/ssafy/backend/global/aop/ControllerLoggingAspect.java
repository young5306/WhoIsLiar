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
	public void restControllerMethods() {
	}

	@Around("restControllerMethods()")
	public Object logController(ProceedingJoinPoint joinPoint) throws Throwable {
		String methodName = joinPoint.getSignature().getName();
		Object[] args = joinPoint.getArgs();

		logger.info("[컨트롤러 REQUEST] ==============================");
		logger.info("▷ Controller Method: {}", methodName);
		logger.info("▷ Request Params: {}", Arrays.toString(args));

		Object result = joinPoint.proceed();

		logger.info("[컨트롤러 RESPONSE]");
		logger.info("▷ Controller Method: {}", methodName);

		if (result instanceof ResponseEntity) {
			ResponseEntity<?> resp = (ResponseEntity<?>)result;

			logger.info("▷ Response Status: {}", resp.getStatusCode());

			Object body = resp.getBody();
			try {
				String json = objectMapper.writeValueAsString(body);
				logger.info("▷ Response Body: {}", json);
			} catch (Exception e) {
				logger.info("▷ Response Body (toString): {}", body);
			}

		} else {
			logger.info("▷ Response Value: {}", result);
		}

		logger.info("================================================");
		return result;
	}
}
