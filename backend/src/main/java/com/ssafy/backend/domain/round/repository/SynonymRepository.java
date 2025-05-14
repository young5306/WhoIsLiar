package com.ssafy.backend.domain.round.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.ssafy.backend.domain.round.entity.CategoryWord;
import com.ssafy.backend.domain.round.entity.Synonym;

public interface SynonymRepository extends JpaRepository<Synonym, Long> {
	List<Synonym> findByMainWord(CategoryWord mainWord);
}
