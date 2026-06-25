-- ============================================================
-- SocialMedia Manager - MySQL Database Schema
-- PHP + MySQL Stack (Shared Hosting Compatible)
-- Timezone: IST (Indian Standard Time +05:30)
-- Encryption: AES-256-GCM for sensitive tokens
-- ============================================================

-- Set IST Timezone
SET time_zone = '+05:30';

CREATE DATABASE IF NOT EXISTS `socialmm`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `socialmm`;

-- ============================================================
-- TABLE 1: users
-- Login / Authentication
-- Demo account: admin@socialai.com / admin123 / OTP: 123456
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `email`           VARCHAR(255)  NOT NULL,
  `password_hash`   VARCHAR(255)  NOT NULL,
  `name`            VARCHAR(255)  DEFAULT NULL,
  `otp_code`        VARCHAR(10)   DEFAULT NULL  COMMENT '6-digit OTP for 2FA',
  `otp_expiry`      DATETIME      DEFAULT NULL  COMMENT 'OTP expire hone ka time',
  `remember_token`  VARCHAR(255)  DEFAULT NULL  COMMENT '"Remember Me" persistent login token',
  `is_active`       TINYINT(1)    DEFAULT 1,
  `created_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `uq_email` (`email`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 2: businesses
-- Multiple brands per user. Har brand = independent settings.
-- Brand identity, contact, logo/display/layout, social links, AI config
-- ============================================================
CREATE TABLE IF NOT EXISTS `businesses` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`         INT           NOT NULL  COMMENT 'FK → users.id. 1 user ke N businesses',

  -- Brand Identity
  `brand_name`      VARCHAR(255)  NOT NULL DEFAULT 'My Brand',
  `brand_color`     VARCHAR(7)    DEFAULT '#4f46e5' COMMENT 'Primary hex color',
  `logo_url`        VARCHAR(500)  DEFAULT NULL,
  `phone`           VARCHAR(50)   DEFAULT NULL,
  `email`           VARCHAR(255)  DEFAULT NULL,
  `address`         TEXT          DEFAULT NULL,

  -- JSON: Logo settings (color, white, black variants + size)
  `logo_settings`   JSON DEFAULT NULL
    COMMENT '{"color":"","white":"","black":"","size":60}',

  -- JSON: Display toggles
  `display_settings` JSON DEFAULT NULL
    COMMENT '{"showLogo":true,"showName":true,"showContact":true,"showSocials":true,"overlayOpacity":90}',

  -- JSON: Layout positions
  `layout_settings` JSON DEFAULT NULL
    COMMENT '{"selectedLayout":"classic","logoPosition":"top-right","namePosition":"bottom-left","addressPosition":"bottom-left","socialPosition":"bottom-right"}',

  -- JSON: Social media URLs + active flags per platform
  `social_links`    JSON DEFAULT NULL
    COMMENT '{"instagram":{"active":true,"url":""},"facebook":{"active":true,"url":""},"linkedin":{"active":true,"url":""},"whatsapp":{"active":true,"url":""},"pinterest":{"active":false,"url":""},"youtube":{"active":false,"url":""},"google_business":{"active":false,"url":""}}',

  -- JSON: AI model + API key config
  `ai_config`       JSON DEFAULT NULL
    COMMENT '{"textModel":"gemini-1.5-flash","imageModel":"imagen","geminiApiKey":"","openaiApiKey":""}',

  `is_active`       TINYINT(1)    DEFAULT 1,
  `created_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT `fk_business_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_user_brand` (`user_id`, `brand_name`),
  INDEX `idx_business_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 3: posts
-- AI-generated social media content.
-- Ek prompt se → caption + hashtags + image + video script generate
-- ============================================================
CREATE TABLE IF NOT EXISTS `posts` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `business_id`     INT           NOT NULL COMMENT 'FK → businesses.id',

  -- User Input
  `prompt`          TEXT          NOT NULL COMMENT 'Original user prompt/idea',
  `language`        VARCHAR(10)   DEFAULT 'hi' COMMENT 'hi / en / mix',

  -- AI Generated: Text
  `caption`         TEXT          DEFAULT NULL,
  `hashtags`        JSON          DEFAULT NULL COMMENT 'JSON array: ["#tag1","#tag2",...]',
  `alternative_captions` JSON    DEFAULT NULL COMMENT 'JSON array of 2-3 alt captions',
  `best_time_to_post` VARCHAR(100) DEFAULT NULL,

  -- AI Generated: Image
  `image_url`       VARCHAR(1000) DEFAULT NULL,
  `image_prompt`    TEXT          DEFAULT NULL COMMENT 'DALL-E / Imagen prompt used',

  -- AI Generated: Video
  `video_script`    TEXT          DEFAULT NULL,
  `video_details`   JSON          DEFAULT NULL
    COMMENT '{"idea":"","videoPrompt":"","scenes":[],"duration":"","musicSuggestion":""}',

  -- Platforms & Scheduling
  `platforms`       JSON          NOT NULL COMMENT 'JSON array: ["instagram","facebook",...]',
  `status`          ENUM('draft','scheduled','published','failed') DEFAULT 'draft',
  `scheduled_at`    DATETIME      DEFAULT NULL,
  `published_at`    DATETIME      DEFAULT NULL,

  -- Engagement (update after publish)
  `engagement`      JSON          DEFAULT NULL
    COMMENT '{"likes":0,"comments":0,"shares":0,"views":0}',

  `created_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT `fk_post_business` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  INDEX `idx_business_status` (`business_id`, `status`),
  INDEX `idx_created` (`created_at` DESC),
  INDEX `idx_scheduled` (`scheduled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 4: social_accounts
-- Connected social media platforms per business.
-- Sensitive fields → AES-256-GCM encrypted in PHP layer.
-- Platform VARCHAR hai: preset + custom dono allow hain.
-- ============================================================
CREATE TABLE IF NOT EXISTS `social_accounts` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `business_id`     INT           NOT NULL COMMENT 'FK → businesses.id',

  -- Platform identity (VARCHAR allows presets + custom platforms)
  `platform`        VARCHAR(50)   NOT NULL
    COMMENT 'instagram|facebook|youtube|whatsapp|google_business|pinterest|linkedin|twitter|tiktok|threads|custom_platform|koi bhi custom name',
  `account_name`    VARCHAR(255)  NOT NULL,
  `account_id`      VARCHAR(255)  DEFAULT NULL COMMENT 'External platform user/page/place ID',
  `profile_url`     VARCHAR(500)  DEFAULT NULL,
  `profile_image`   VARCHAR(500)  DEFAULT NULL,

  -- Sensitive fields (AES-256-GCM encrypted by PHP, stored as base64 TEXT)
  `access_token`    TEXT          DEFAULT NULL COMMENT '🔐 AES-256-GCM encrypted ciphertext',
  `token_expiry`    DATETIME      DEFAULT NULL,
  `refresh_token`   TEXT          DEFAULT NULL COMMENT '🔐 AES-256-GCM encrypted ciphertext',
  `app_id`          VARCHAR(255)  DEFAULT NULL,
  `app_secret`      TEXT          DEFAULT NULL COMMENT '🔐 AES-256-GCM encrypted ciphertext',

  -- Encryption metadata (unique IV + GCM tag per row)
  `encryption_iv`   VARCHAR(100)  DEFAULT NULL COMMENT '16-byte IV, base64 encoded',
  `encryption_tag`  VARCHAR(100)  DEFAULT NULL COMMENT 'GCM authentication tag, base64 encoded',

  -- Status & Stats
  `status`          ENUM('connected','expired','disconnected','pending') DEFAULT 'connected',
  `stats`           JSON          DEFAULT NULL
    COMMENT '{"followers":0,"following":0,"posts":0}',

  `is_active`       TINYINT(1)    DEFAULT 1,
  `notes`           TEXT          DEFAULT NULL,

  `created_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT `fk_account_business` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_business_platform` (`business_id`, `platform`),
  INDEX `idx_platform` (`platform`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
