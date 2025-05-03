package com.ssafy.backend.domain.round.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ssafy.backend.domain.round.entity.Round;

public interface RoundRepository extends JpaRepository<Round, Long> {
}
