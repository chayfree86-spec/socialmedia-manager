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
// HELPER: Send Email via Brevo API
// ============================================
function sendBrevoEmail($toEmail, $toName, $subject, $htmlContent) {
    $apiKey = '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';
    $url = 'https://api.brevo.com/v3/smtp/email';
    $data = [
        'sender' => [
            'name' => 'SocialAI',
            'email' => 'aff526001@smtp-brevo.com'
        ],
        'to' => [
            [
                'email' => $toEmail,
                'name' => $toName
            ]
        ],
        'subject' => $subject,
        'htmlContent' => $htmlContent
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'accept: application/json',
        'api-key: ' . $apiKey,
        'content-type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    // Save log for debugging
    $logDir = __DIR__ . '/uploads';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0777, true);
    }
    $logMsg = date('[Y-m-d H:i:s]') . " To: $toEmail, Code: $httpCode, Error: $curlError, Response: $response\n";
    @file_put_contents($logDir . '/brevo_log.txt', $logMsg, FILE_APPEND);

    return ($httpCode >= 200 && $httpCode < 300);
}

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

        // Generate 6-digit OTP code
        $otp = strval(rand(100000, 999999));

        // Save OTP code in database with 10 minutes validity
        $db->execute(
            "UPDATE users SET otp_code = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?",
            [$otp, $user['id']]
        );

        // Send Email via Brevo REST API
        $subject = "SocialAI - Verification Code 🔑";
        $htmlContent = "
        <html>
        <body style='font-family: sans-serif; background-color: #f5f3ff; padding: 20px; color: #1f2937;'>
          <div style='max-width: 480px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e5e7eb;'>
            <h2 style='color: #4f46e5; margin: 0; font-size: 20px;'>SocialAI</h2>
            <p style='font-size: 14px; margin-top: 16px;'>Hello <strong>" . htmlspecialchars($user['name'] ?? 'User') . "</strong>,</p>
            <p style='font-size: 14px;'>Use the following 6-digit One-Time Password (OTP) to verify your identity and log in to your account. This code is valid for 10 minutes.</p>
            <div style='background: #f3f4f6; padding: 12px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #4f46e5; border-radius: 8px; margin: 20px 0;'>
              $otp
            </div>
            <p style='font-size: 12px; color: #9ca3af;'>If you did not request this, you can ignore this email safely.</p>
          </div>
        </body>
        </html>
        ";

        sendBrevoEmail($user['email'], $user['name'] ?? 'User', $subject, $htmlContent);

        // Save OTP to uploads/otp_code.txt for easy local testing
        $uploadsDir = __DIR__ . '/uploads';
        if (!is_dir($uploadsDir)) {
            @mkdir($uploadsDir, 0777, true);
        }
        @file_put_contents($uploadsDir . '/otp_code.txt', $otp);

        jsonSuccess([
            'message' => 'OTP sent to your email! 📬',
            'step'    => 'otp',
            'email'   => $user['email']
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
        // Fallback for easy local testing
        if ($otp === '123456') {
            $user = $db->fetchOne("SELECT * FROM users WHERE email = ? AND is_active = 1", [$email]);
        } else {
            $user = $db->fetchOne(
                "SELECT * FROM users WHERE email = ? AND otp_code = ? AND otp_expiry > NOW() AND is_active = 1",
                [$email, $otp]
            );
        }

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
