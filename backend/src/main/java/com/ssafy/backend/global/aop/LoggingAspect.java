package com.ssafy.backend.global.aop;

import java.util.Arrays;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

// @Aspect
// @Component
public class LoggingAspect {
	private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

	@Pointcut("execution(* com.ssafy.backend.domain..*(..))")
	public void domainServiceMethods() {}

	@Around("domainServiceMethods()")
	public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
		String className = joinPoint.getSignature().getDeclaringTypeName();
		String methodName = joinPoint.getSignature().getName();
		Object[] args = joinPoint.getArgs();

		logger.info("Entering {}.{}() with arguments = {}", className, methodName, Arrays.toString(args));
		try {
			Object result = joinPoint.proceed();
			logger.info("Exiting {}.{}() with result = {}", className, methodName, result);
			return result;
		} catch (Throwable ex) {
			logger.error("Exception in {}.{}(): {}", className, methodName, ex.getMessage(), ex);
			throw ex;
		}
	}
}
