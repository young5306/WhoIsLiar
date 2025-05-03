package com.ssafy.backend.domain.round.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ssafy.backend.domain.participant.entity.Participant;
import com.ssafy.backend.domain.participant.repository.ParticipantRepository;
import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.domain.room.repository.RoomRepository;
import com.ssafy.backend.domain.round.dto.request.AssignRoleRequest;
import com.ssafy.backend.domain.round.dto.response.AssignRoleResponse;
import com.ssafy.backend.domain.round.dto.response.RoundWordResponse;
import com.ssafy.backend.domain.round.entity.CategoryWord;
import com.ssafy.backend.domain.round.entity.Round;
import com.ssafy.backend.domain.round.repository.CategoryWordRepository;
import com.ssafy.backend.domain.round.repository.RoundRepository;
import com.ssafy.backend.global.common.ResponseCode;
import com.ssafy.backend.global.enums.Category;
import com.ssafy.backend.global.enums.GameMode;
import com.ssafy.backend.global.enums.RoundStatus;
import com.ssafy.backend.global.exception.CustomException;

@Service
@Transactional
public class RoundService {

	private final RoomRepository roomRepository;
	private final ParticipantRepository participantRepository;
	private final RoundRepository roundRepository;
	private final CategoryWordRepository categoryWordRepository;
	private final Random random = new Random();
	private final GptService gptService;

	public RoundService(RoomRepository roomRepository,
		ParticipantRepository participantRepository, RoundRepository roundRepository,
		CategoryWordRepository categoryWordRepository, GptService gptService) {
		this.roomRepository = roomRepository;
		this.participantRepository = participantRepository;
		this.roundRepository = roundRepository;
		this.categoryWordRepository = categoryWordRepository;
		this.gptService = gptService;
	}

	/**
	 * 라운드 역할(라이어) 할당
	 */
	public AssignRoleResponse assignRole(AssignRoleRequest request) {
		Room room = roomRepository.findByRoomCode(request.roomCode())
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		List<Participant> participants = participantRepository.findByRoom(room);
		if (participants.isEmpty()) {
			throw new CustomException(ResponseCode.NOT_FOUND);
		}

		Participant liar = participants.get(random.nextInt(participants.size()));
		Long liarId = liar.getId();
		String liarNickname = liar.getSession().getNickname();

		return new AssignRoleResponse(liarId, liarNickname);
	}

	@Transactional(readOnly = true)
	public RoundWordResponse getRoundWord(Long roundId) {
		Round round = roundRepository.findById(roundId)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
		Room room = round.getRoom();
		Category cat = room.getCategory();

		List<CategoryWord> candidates =
			(cat == Category.랜덤)? categoryWordRepository.findAll() : categoryWordRepository.findByCategory(cat);
		if(candidates.isEmpty()) {System.out.println("오잉 왜 하나도 없지");}
		if (candidates.isEmpty()) throw new CustomException(ResponseCode.NOT_FOUND);

		String w1 = candidates.get(random.nextInt(candidates.size())).getWord();
		String w2 = null;
		if (room.getGameMode() == GameMode.FOOL) {
			w2 = gptService.getSimilarWord(w1, room.getCategory().name());
		}

		round.setWord1(w1);
		round.setWord2(w2 == null ? "" : w2);
		round.setUpdatedAt(LocalDateTime.now());
		round.setRoundStatus(RoundStatus.waiting);
		roundRepository.save(round);

		return new RoundWordResponse(w1, w2);
	}
}
