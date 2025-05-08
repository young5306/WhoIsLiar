package com.ssafy.backend.domain.round.service;

import com.ssafy.backend.domain.chat.service.ChatSocketService;
import com.ssafy.backend.domain.participant.entity.ParticipantRound;
import com.ssafy.backend.domain.participant.repository.ParticipantRoundRepository;
import com.ssafy.backend.global.enums.ResponseCode;
import com.ssafy.backend.global.exception.CustomException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TurnExecutionService {

	private final ParticipantRoundRepository participantRoundRepository;
	private final ChatSocketService chatSocketService;

	@Transactional
	public void executeTurn(String roomCode, Long participantRoundId, int currentIndex,
		TurnTimerService.TurnState state, TurnTimerService service) {
		ParticipantRound pr = participantRoundRepository.findById(participantRoundId)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		String nickname = pr.getParticipant().getSession().getNickname();
		chatSocketService.sendTurnEnd(roomCode, nickname);

		// static 메서드 호출로 순환 참조 회피
		TurnTimerService.updateStateAndProceed(roomCode, currentIndex, state, service);
	}
}
