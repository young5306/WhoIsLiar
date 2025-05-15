package com.ssafy.backend.domain.round.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;

@Entity
@Table(name = "synonym")
@Getter
public class Synonym {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String synonym;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "main_word_id", nullable = false)
	private CategoryWord mainWord;

	protected Synonym() {
	}

	public Synonym(String synonym, CategoryWord mainWord) {
		this.synonym = synonym;
		this.mainWord = mainWord;
	}
}
