package com.ssafy.backend.domain.room.dto.request;

import com.ssafy.backend.global.enums.Category;

public record SelectCategoryRequest(
	String roomCode,
	Category category
) {
}
