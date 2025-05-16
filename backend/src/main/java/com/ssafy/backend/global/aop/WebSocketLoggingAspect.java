package com.ssafy.backend.global.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

@Aspect
@Component
@Order(0)
public class WebSocketLoggingAspect {

	private static final Logger logger = LoggerFactory.getLogger(WebSocketLoggingAspect.class);
	private final ObjectMapper objectMapper;

	public WebSocketLoggingAspect(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	/** @MessageMapping 이 붙은 WS 핸들러 전용 포인트컷 */
	@Pointcut("@annotation(org.springframework.messaging.handler.annotation.MessageMapping)")
	public void messageMappingMethods() {
	}

	@Around("messageMappingMethods()")
	public Object logWebSocket(ProceedingJoinPoint joinPoint) throws Throwable {
		String sig = joinPoint.getSignature().toShortString();
		Object[] args = joinPoint.getArgs();

		if (args != null && args.length > 0) {
			try {
				String payload = objectMapper.writeValueAsString(args[0]);
				logger.info("[WS REQUEST]  {} ▶ payload={}", sig, payload);
			} catch (Exception e) {
				logger.info("[WS REQUEST]  {} ▶ payload(toString)={}", sig, args[0]);
			}
		} else {
			logger.info("[WS REQUEST]  {} ▶ no payload", sig);
		}

		Object result = joinPoint.proceed();

		if (result != null) {
			try {
				String json = objectMapper.writeValueAsString(result);
				logger.info("[WS RESPONSE] {} ▶ return={}", sig, json);
			} catch (Exception e) {
				logger.info("[WS RESPONSE] {} ▶ return(toString)={}", sig, result);
			}
		} else {
			logger.info("[WS RESPONSE] {} ▶ return=null", sig);
		}

		return result;
	}
}
