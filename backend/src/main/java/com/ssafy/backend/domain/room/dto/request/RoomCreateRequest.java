package com.ssafy.backend.domain.room.dto.request;

import com.ssafy.backend.global.enums.GameMode;
import com.ssafy.backend.global.enums.VideoMode;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
@Schema(description = "방 생성 요청 DTO")
public record RoomCreateRequest(

	@Schema(description = "호스트 닉네임", example = "그림자은영")
	@NotBlank(message = "호스트 닉네임은 필수입니다.")
	@Size(min = 2, max = 10, message = "닉네임은 2~10자여야 합니다.")
	@Pattern(regexp = "^[A-Za-z0-9가-힣]+$", message = "닉네임은 영어, 한글, 숫자만 사용할 수 있습니다.")
	String hostNickname,

	@Schema(description = "게임 모드", example = "DEFAULT")
	@NotNull(message = "게임 모드를 선택해주세요.")
	GameMode gameMode,

	@Schema(description = "방 모드", example = "VIDEO")
	@NotNull(message = "비디오 모드를 선택해주세요.")
	VideoMode videoMode,

	@Schema(description = "방 제목", example = "재밌는 방")
	@NotBlank(message = "방 제목을 입력해주세요.")
	@Size(max = 50, message = "방 제목은 최대 50자까지 가능합니다.")
	String roomName,

	@Schema(description = "비밀번호", example = "1234", nullable = true)
	@Pattern(
		regexp = "^$|\\d{4}",
		message = "비밀번호는 비워두거나 숫자 4자리여야 합니다."
	)
	String password,

	@Schema(description = "라운드 수", example = "5")
	@Min(value = 1, message = "라운드 수는 최소 1 이상이어야 합니다.")
	int roundCount
) {
}
