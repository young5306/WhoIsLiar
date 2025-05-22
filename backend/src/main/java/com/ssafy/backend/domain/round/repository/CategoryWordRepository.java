package com.ssafy.backend.domain.round.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ssafy.backend.domain.round.entity.CategoryWord;
import com.ssafy.backend.global.enums.Category;

public interface CategoryWordRepository extends JpaRepository<CategoryWord, Long> {
	List<CategoryWord> findByCategory(Category category);

	Optional<CategoryWord> findByWordIgnoreCase(String word);
}

