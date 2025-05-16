package com.ssafy.backend.global.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {
	public static Authentication getAuthentication() {
		return SecurityContextHolder.getContext().getAuthentication();
	}

	public static String getCurrentNickname() {
		Authentication auth = getAuthentication();
		if (auth == null || !auth.isAuthenticated()) {
			return null;
		}
		return (String)auth.getPrincipal();
	}
}
