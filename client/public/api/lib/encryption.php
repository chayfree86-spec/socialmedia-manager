<?php
/**
 * AES-256-GCM Encryption Helper
 * 
 * Usage:
 *   $encrypted = Encryption::encrypt('secret token');
 *   $plain     = Encryption::decrypt($ciphertext, $iv, $tag);
 */

class Encryption {
    
    /**
     * Encryption key from environment variable
     * Production mein .env file se load karein
     */
    private static function getKey(): string {
        $key = getenv('ENCRYPTION_KEY') ?: 'socialai-encryption-key-2024-change-in-production!!';
        // Ensure key is exactly 32 bytes for AES-256
        return substr(hash('sha256', $key, true), 0, 32);
    }

    /**
     * Encrypt plaintext using AES-256-GCM
     * Returns ['ciphertext' => base64, 'iv' => base64, 'tag' => base64]
     */
    public static function encrypt(string $plaintext): array {
        if (empty($plaintext)) {
            return ['ciphertext' => '', 'iv' => '', 'tag' => ''];
        }

        $key = self::getKey();
        $iv  = openssl_random_pseudo_bytes(16); // 16 bytes IV for GCM
        $tag = '';

        $ciphertext = openssl_encrypt(
            $plaintext,
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            '',
            16 // tag length
        );

        if ($ciphertext === false) {
            throw new Exception('AES-256-GCM encryption failed');
        }

        return [
            'ciphertext' => base64_encode($ciphertext),
            'iv'         => base64_encode($iv),
            'tag'        => base64_encode($tag)
        ];
    }

    /**
     * Decrypt AES-256-GCM ciphertext
     */
    public static function decrypt(string $ciphertextB64, string $ivB64, string $tagB64): string {
        if (empty($ciphertextB64) || empty($ivB64) || empty($tagB64)) {
            return '';
        }

        $key        = self::getKey();
        $ciphertext = base64_decode($ciphertextB64);
        $iv         = base64_decode($ivB64);
        $tag        = base64_decode($tagB64);

        if ($ciphertext === false || $iv === false || $tag === false) {
            return '';
        }

        $plaintext = openssl_decrypt(
            $ciphertext,
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        return $plaintext !== false ? $plaintext : '';
    }

    /**
     * Encrypt & return ready-to-store values for DB insert
     */
    public static function encryptForDb(string $plaintext): array {
        $enc = self::encrypt($plaintext);
        return [
            'encrypted'      => $enc['ciphertext'],
            'encryption_iv'  => $enc['iv'],
            'encryption_tag' => $enc['tag']
        ];
    }

    /**
     * Decrypt from DB row fields
     */
    public static function decryptFromDb(?string $ciphertext, ?string $iv, ?string $tag): string {
        if (empty($ciphertext)) return '';
        return self::decrypt($ciphertext, $iv ?? '', $tag ?? '');
    }
}
