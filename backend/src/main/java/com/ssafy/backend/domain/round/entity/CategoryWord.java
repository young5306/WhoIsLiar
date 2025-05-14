package com.ssafy.backend.domain.round.entity;

import java.util.List;

import com.ssafy.backend.global.enums.Category;

import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "category_words")
@Getter
public class CategoryWord {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Category category;

	@Column(nullable = false, length = 100)
	private String word;

	@OneToMany(mappedBy = "mainWord", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Synonym> synonyms;
}
