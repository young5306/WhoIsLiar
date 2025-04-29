-- 사용자 세션 테이블
CREATE TABLE IF NOT EXISTS sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nickname VARCHAR(255) NOT NULL,
    token VARCHAR(36) NOT NULL,
    created_at DATETIME NOT NULL,
    last_active_at DATETIME,
    UNIQUE KEY uk_sessions_token (token),
    UNIQUE KEY uk_sessions_nickname (nickname)
);

-- 방 정보 테이블
CREATE TABLE IF NOT EXISTS rooms (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    host_id BIGINT NOT NULL,
    room_code VARCHAR(50) NOT NULL,
    room_name VARCHAR(255) NOT NULL,
    password VARCHAR(50),
    round_count INT NOT NULL,
    mode ENUM('video', 'blind') NOT NULL,
    category ENUM('랜덤', '음식', '동물', '영화/드라마', '인물', '스포츠', '노래', '브랜드') NOT NULL DEFAULT '랜덤',
    room_status ENUM('waiting', 'playing', 'finished') NOT NULL DEFAULT 'waiting',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (host_id) REFERENCES sessions(id),
    UNIQUE KEY uk_rooms_room_code (room_code)
);

-- 방 참가자 테이블
CREATE TABLE IF NOT EXISTS participants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES sessions(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- 채팅 테이블
CREATE TABLE IF NOT EXISTS chats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_id BIGINT NOT NULL,
    sender_id BIGINT,
    chat VARCHAR(255) NOT NULL,
    chat_type ENUM('NORMAL', 'ROUND_START', 'ROUND_END', 'PLAYER_JOIN', 'PLAYER_LEAVE', 'GAME_START', 'GAME_END', 'GAME_FORCE_END') NOT NULL DEFAULT 'NORMAL',
    created_at DATETIME NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES sessions(id)
);

-- 라운드 정보 테이블
CREATE TABLE IF NOT EXISTS rounds (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_id BIGINT NOT NULL,
    round_number INT NOT NULL,
    word VARCHAR(50) NOT NULL,
    round_status ENUM('waiting', 'hint', 'discussion', 'voting', 'finished') NOT NULL,
    winner ENUM('civil', 'liar'),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- 참가자-라운드 관계 테이블
CREATE TABLE IF NOT EXISTS participants_rounds (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    participant_id BIGINT NOT NULL,
    round_id BIGINT NOT NULL,
    `order` INT NOT NULL,
    is_liar BOOLEAN NOT NULL,
    target_participant_id BIGINT,
    score INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (target_participant_id) REFERENCES participants(id) ON DELETE CASCADE
);
