CREATE TABLE `sessions` (
                            `id` BIGINT NOT NULL AUTO_INCREMENT,
                            `token` VARCHAR(36) NOT NULL,
                            `nickname` VARCHAR(255) NOT NULL,
                            `created_at` DATETIME NOT NULL,
                            `last_active_at` DATETIME NOT NULL,
                            PRIMARY KEY (`id`),
                            UNIQUE KEY `uk_sessions_token` (`token`),
                            UNIQUE KEY `uk_sessions_nickname` (`nickname`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;