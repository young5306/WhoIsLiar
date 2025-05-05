package com.ssafy.backend.domain.chat.event;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.ssafy.backend.domain.auth.entity.SessionEntity;
import com.ssafy.backend.domain.auth.repository.SessionRepository;
import com.ssafy.backend.domain.chat.dto.ChatMessage;
import com.ssafy.backend.domain.participant.entity.Participant;
import com.ssafy.backend.domain.participant.repository.ParticipantRepository;
import com.ssafy.backend.domain.room.entity.Room;
import com.ssafy.backend.domain.room.repository.RoomRepository;
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
	private final SessionRepository sessionRepository;

	@EventListener
	public void handleDisconnect(SessionDisconnectEvent event) {
		StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
		String nickname = (String) accessor.getSessionAttributes().get("nickname");
		String roomCode = (String) accessor.getSessionAttributes().get("roomCode");

		if (nickname == null || roomCode == null) return;

		log.info("끊김 감지 - nickname: {}, roomCode: {}", nickname, roomCode);

		Room room = roomRepository.findByRoomCode(roomCode).orElse(null);
		if (room == null || !room.getRoomStatus().equals(RoomStatus.playing)) return;

		SessionEntity session = sessionRepository.findByNickname(nickname)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
		Participant participant = participantRepository.findByRoomAndSession(room, session).orElse(null);
		if (participant != null) {
			participantRepository.delete(participant);
			log.info("참가자 {} 방에서 제거됨", nickname);
		}

		messagingTemplate.convertAndSend("/topic/room." + roomCode,
			new ChatMessage("SYSTEM", nickname + "님이 퇴장하였습니다.", ChatType.PLAYER_LEAVE));
	}
}

