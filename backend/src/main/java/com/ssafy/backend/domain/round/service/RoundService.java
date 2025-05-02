package com.ssafy.backend.domain.round.service;

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
import com.ssafy.backend.global.common.ResponseCode;
import com.ssafy.backend.global.exception.CustomException;

@Service
@Transactional
public class RoundService {

	private final RoomRepository roomRepository;
	private final ParticipantRepository participantRepository;
	private final Random random = new Random();

	public RoundService(RoomRepository roomRepository,
		ParticipantRepository participantRepository) {
		this.roomRepository = roomRepository;
		this.participantRepository = participantRepository;
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
}
