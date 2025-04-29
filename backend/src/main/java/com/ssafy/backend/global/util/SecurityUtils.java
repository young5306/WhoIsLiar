package com.ssafy.backend.global.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {
	/** 현재 Authentication을 가져옵니다. 인증이 안 되어 있으면 null일 수 있습니다. */
	public static Authentication getAuthentication() {
		return SecurityContextHolder.getContext().getAuthentication();
	}

	/** 현재 로그인한 사용자의 닉네임(String principal)을 리턴합니다. */
	public static String getCurrentNickname() {
		Authentication auth = getAuthentication();
		if (auth == null || !auth.isAuthenticated()) {
			return null;
		}
		// principal이 String(닉네임)이면 이렇게 꺼내고,
		return (String)auth.getPrincipal();
	}
}
