<?php
/**
 * Authentication API
 * 
 * POST /api/auth.php?action=login      → Email + Password
 * POST /api/auth.php?action=verify-otp → OTP Verification
 * POST /api/auth.php?action=logout     → Clear session
 */

require_once __DIR__ . '/lib/response.php';
require_once __DIR__ . '/config/database.php';

sendCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = getQueryAction();

if ($method !== 'POST') {
    jsonError('POST required');
}

$input = getJsonInput();

// ============================================
// LOGIN
// ============================================
if ($action === 'login') {
    $email      = trim($input['email'] ?? '');
    $password   = $input['password'] ?? '';
    $rememberMe = (bool)($input['rememberMe'] ?? $input['remember_me'] ?? false);

    if (empty($email) || empty($password)) {
        jsonError('Please enter both email and password.');
    }

    try {
        $user = $db->fetchOne("SELECT * FROM users WHERE email = ? AND is_active = 1", [$email]);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            jsonError('Invalid email or password.');
        }

        // Bypass OTP — direct login
        $token = $rememberMe ? bin2hex(random_bytes(32)) : null;
        if ($rememberMe) {
            $db->execute("UPDATE users SET remember_token = ? WHERE id = ?", [$token, $user['id']]);
        }

        jsonSuccess([
            'message' => 'Logged in successfully! 🚀',
            'user'    => [
                'id'    => $user['id'],
                'email' => $user['email'],
                'name'  => $user['name'],
            ],
            'token'   => $token,
        ]);

    } catch (Exception $e) {
        jsonError('Login failed. Please try again.', 500);
    }
}

// ============================================
// VERIFY OTP
// ============================================
elseif ($action === 'verify-otp' || $action === 'verify_otp') {
    $email      = trim($input['email'] ?? '');
    $otp        = trim($input['otp'] ?? $input['otpCode'] ?? '');
    $rememberMe = (bool)($input['rememberMe'] ?? $input['remember_me'] ?? false);

    if (strlen($otp) !== 6) {
        jsonError('Please enter a valid 6-digit OTP code.');
    }

    try {
        $user = $db->fetchOne(
            "SELECT * FROM users WHERE email = ? AND otp_code = ? AND otp_expiry > NOW() AND is_active = 1",
            [$email, $otp]
        );

        if (!$user) {
            jsonError('Incorrect OTP code. Please try again.');
        }

        // Generate remember token
        $token = bin2hex(random_bytes(32));
        if ($rememberMe) {
            $db->execute(
                "UPDATE users SET otp_code = NULL, otp_expiry = NULL, remember_token = ? WHERE id = ?",
                [$token, $user['id']]
            );
        } else {
            $db->execute(
                "UPDATE users SET otp_code = NULL, otp_expiry = NULL WHERE id = ?",
                [$user['id']]
            );
        }

        jsonSuccess([
            'message' => 'Email verified successfully! Logging you in... 🚀',
            'user'    => [
                'id'    => $user['id'],
                'email' => $user['email'],
                'name'  => $user['name'],
            ],
            'token'   => $rememberMe ? $token : null,
        ]);

    } catch (Exception $e) {
        jsonError('Verification failed. Please try again.', 500);
    }
}

// ============================================
// LOGOUT
// ============================================
elseif ($action === 'logout') {
    jsonSuccess(['message' => 'Logged out successfully.']);
}

else {
    jsonError('Invalid action. Use: login, verify-otp, logout');
}
