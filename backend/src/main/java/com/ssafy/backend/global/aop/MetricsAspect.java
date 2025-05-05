package com.ssafy.backend.global.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

@Aspect
@Component
public class MetricsAspect {
	private final MeterRegistry meterRegistry;

	public MetricsAspect(MeterRegistry meterRegistry) {
		this.meterRegistry = meterRegistry;
	}

	@Pointcut("execution(* com.ssafy.backend.domain..*(..))")
	public void domainServiceMethods() {}

	@Around("domainServiceMethods()")
	public Object measureExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
		String metricName = joinPoint.getSignature().getDeclaringTypeName() + "." + joinPoint.getSignature().getName();
		Timer.Sample sample = Timer.start(meterRegistry);
		Object result = null;
		try {
			result = joinPoint.proceed();
			return result;
		} finally {
			sample.stop(
				Timer.builder(metricName)
					.description("Execution time of " + metricName)
					.register(meterRegistry)
			);
		}
	}
}

