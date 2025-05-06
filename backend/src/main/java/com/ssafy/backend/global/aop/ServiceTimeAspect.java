package com.ssafy.backend.global.aop;

import java.util.Arrays;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Order(1)  // 컨트롤러 로깅(@Order(0)) 다음에 실행되게 하려면 이 값을 조정하세요.
public class ServiceTimeAspect {
	private static final Logger logger = LoggerFactory.getLogger(ServiceTimeAspect.class);

	// com.ssafy.backend.domain 패키지 하위의 *Service 클래스 전부
	@Pointcut("within(com.ssafy.backend.domain..*Service)")
	public void serviceLayer() {}

	@Pointcut("execution(* com.ssafy.backend.domain.auth.service.AuthService.validateAndRefresh(..))")
	public void excludeValidate() {}

	// @Around("serviceLayer()")
	@Around("serviceLayer() && !excludeValidate()")
	public Object logService(ProceedingJoinPoint joinPoint) throws Throwable {
		String className  = joinPoint.getSignature().getDeclaringType().getSimpleName();
		String methodName = joinPoint.getSignature().getName();
		Object[] args     = joinPoint.getArgs();

		logger.debug("[SERVICE START]");
		logger.debug("▶ 메서드 이름 : {}.{}", className, methodName);
		logger.debug("▶ 요청 값     : {}", Arrays.toString(args));

		long start = System.currentTimeMillis();
		Object result = joinPoint.proceed();
		long elapsed = System.currentTimeMillis() - start;

		logger.debug("[SERVICE END]");
		logger.debug("▶ 메서드 이름 : {}.{}", className, methodName);
		logger.debug("▶ 실행시간   : {} ms", elapsed);
		logger.debug("▶ 반환 값     : {}", result);

		return result;
	}
}
