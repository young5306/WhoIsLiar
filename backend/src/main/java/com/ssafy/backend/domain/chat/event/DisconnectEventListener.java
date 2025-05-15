package com.ssafy.backend.domain.chat.event;

import java.util.List;

import com.ssafy.backend.domain.round.service.RoundService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.auth.repository.SessionRepository;
import com.ssafy.backend.domain.chat.dto.ChatMessage;
import com.ssafy.backend.domain.participant.entity.Participant;
import com.ssafy.backend.domain.participant.repository.ParticipantRepository;
import com.ssafy.backend.domain.participant.repository.ParticipantRoundRepository;
import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.domain.room.repository.RoomRepository;
import com.ssafy.backend.domain.round.entity.Round;
import com.ssafy.backend.domain.round.repository.RoundRepository;
import com.ssafy.backend.domain.round.service.TurnTimerService;
import com.ssafy.backend.global.enums.ChatType;
import com.ssafy.backend.global.enums.ResponseCode;
import com.ssafy.backend.global.enums.RoomStatus;
import com.ssafy.backend.global.exception.CustomException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DisconnectEventListener {

	private final SimpMessagingTemplate messagingTemplate;
	private final RoomRepository roomRepository;
	private final ParticipantRepository participantRepository;
	private final ParticipantRoundRepository participantRoundRepository;
	private final SessionRepository sessionRepository;
	private final ChatSessionRegistry sessionRegistry;
	private final TurnTimerService turnTimerService;
	private final RoundRepository roundRepository;
	private final RoundService roundService;

	@EventListener
	public void handleDisconnect(SessionDisconnectEvent event) {
		StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

		if (accessor.getCommand() != StompCommand.DISCONNECT) {
			return;
		}

		String sessionId = accessor.getSessionId();
		// 2) 구독된 적 없는 세션이면 무시 (unregister 하면 true)
		if (!sessionRegistry.unregister(sessionId)) {
			return;
		}

		String nickname = (String)accessor.getSessionAttributes().get("nickname");
		String roomCode = (String)accessor.getSessionAttributes().get("roomCode");

		if (nickname == null || roomCode == null)
			return;

		log.info("************************************************");
		log.info("[WS DISCONNECT] 끊김 감지 - sessionId: {}, nickname: {}, roomCode: {}", accessor.getSessionId(), nickname,
			roomCode);

		Room room = roomRepository.findByRoomCodeFetchSession(roomCode).orElse(null);
		if (room == null)
			return;

		SessionEntity session = sessionRepository.findByNickname(nickname)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

		boolean wasHost = room.getSession().getId().equals(session.getId());

		Participant participant = participantRepository.findByRoomAndSession(room, session).orElse(null);
		if (participant != null) {
			// participantRepository.delete(participant);
			log.info("[WS GameMessage] {}님이 퇴장하셨습니다.", nickname);

			if (room.getRoomStatus() == RoomStatus.waiting) {
				participantRepository.deleteById(participant.getId());
			} else {
				participant.setActive(false);
				participantRepository.save(participant);
			}

			TurnTimerService.TurnState state = turnTimerService.getTurnState(roomCode);
			if (state != null) {
				Round round = roundRepository.findByRoomAndRoundNumber(room, state.getRoundNumber())
					.orElse(null);
				if (round != null) {
					participantRoundRepository.findByRoundAndParticipant(round, participant)
						.ifPresent(pr -> {
							if (pr.getId().equals(state.getCurrentParticipantRoundId())) {
								log.info("[WS TURN] 발언 중 참가자 퇴장 -> 즉시 endTurn 호출");
								turnTimerService.endTurnSilently(roomCode);
							}
						});
				}
			}

			// 호스트가 강제 이탈 시 위임
			if (wasHost) {
				List<Participant> remain = participantRepository
					.findByRoomAndIsActiveTrueOrderByCreatedAtAsc(room);

				if (remain.isEmpty()) {
					roomRepository.deleteById(room.getId());
				} else {
					SessionEntity newHost = remain.get(0).getSession();
					room.changeHost(newHost);
					roundService.initReadyStatus(room);
					roomRepository.save(room);
				}
			} else {
				int activeCount = participantRepository.countByRoomAndIsActiveTrue(room);
				if (activeCount == 0) {
					roomRepository.deleteById(room.getId());
				}
			}
		}

		messagingTemplate.convertAndSend("/topic/room." + roomCode,
			new ChatMessage("SYSTEM", nickname + "님이 퇴장하였습니다.", ChatType.PLAYER_LEAVE));
		log.info("************************************************");
	}
}

