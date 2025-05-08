package com.ssafy.backend.domain.chat.event;

import java.time.LocalDateTime;
import java.util.List;

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

		log.info("************************************************");
		log.info("[WS DISCONNECT] 끊김 감지 - sessionId: {}, nickname: {}, roomCode: {}", accessor.getSessionId() ,nickname, roomCode);

		Room room = roomRepository.findByRoomCode(roomCode).orElse(null);
		if (room == null) return;

		SessionEntity session = sessionRepository.findByNickname(nickname)
			.orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
		boolean wasHost = room.getSession().equals(session);

		Participant participant = participantRepository.findByRoomAndSession(room, session).orElse(null);
		if (participant != null) {
			// participantRepository.delete(participant);
			log.info("[WS GameMessage] {}님이 퇴장하셨습니다.", nickname);

			if (room.getRoomStatus() == RoomStatus.waiting) {
				participantRepository.deleteById(participant.getId());
			} else {
				participant.setActive(false);
			}

			// 호스트가 강제 이탈 시 위임
			if (wasHost) {
				List<Participant> remain = participantRepository
					.findByRoomAndIsActiveTrueOrderByCreatedAtAsc(room);

				if (remain.isEmpty()) {
					roomRepository.deleteById(room.getId());
				} else {
					SessionEntity newHost = remain.get(0).getSession();
					room.setSession(newHost);
					room.setUpdatedAt(LocalDateTime.now());
					roomRepository.save(room);
				}
			}else{
				int activeCount = participantRepository.countByRoomAndIsActiveTrue(room);
				if(activeCount == 0){
					roomRepository.deleteById(room.getId());
				}
			}

			// if (room.getRoomStatus() == RoomStatus.waiting) {
			// 	// 참가자 제거
			// 	participantRepository.delete(participant);
			//
			// 	// (남은 활성 참가자 수 == 0) => 방 삭제
			// 	int activeCount = participantRepository.countByRoomAndIsActiveTrue(room);
			// 	if (activeCount  == 0) {
			// 		roomRepository.delete(room); // 마지막 인원이면 방도 삭제
			// 	}
			// } else if (room.getRoomStatus() == RoomStatus.playing) {
			// 	// 게임 중이면 비활성화만
			// 	participant.setActive(false);
			//
			// 	// 예비 로직 - 활성화 인원 0명이면 방폭
			// 	int activeCount = participantRepository.countByRoomAndIsActiveTrue(room);
			// 	if (activeCount  == 0) {
			// 		roomRepository.delete(room); // 마지막 인원이면 방도 삭제
			// 	}
			// } else {
			// 	throw new CustomException(ResponseCode.SERVER_ERROR);
			// }
		}

		messagingTemplate.convertAndSend("/topic/room." + roomCode,
			new ChatMessage("SYSTEM", nickname + "님이 퇴장하였습니다.", ChatType.PLAYER_LEAVE));
		log.info("************************************************");
	}
}

