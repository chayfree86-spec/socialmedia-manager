<?php
header('Content-Type: text/plain');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "--- DIAGNOSTICS ---\n";
echo "PHP Version: " . phpversion() . "\n";
echo "CURL Loaded: " . (extension_loaded('curl') ? 'YES' : 'NO') . "\n";

$apiKey = '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';

// 1. Get Senders
echo "\n--- FETCHING VERIFIED SENDERS FROM BREVO ---\n";
$sendersUrl = 'https://api.brevo.com/v3/senders';
$ch = curl_init($sendersUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'accept: application/json',
    'api-key: ' . $apiKey
]);
$sendersResponse = curl_exec($ch);
$sendersHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP CODE: $sendersHttpCode\n";
echo "RESPONSE:\n$sendersResponse\n";

// 2. Parse senders to see if we can find a verified one
$sendersData = json_decode($sendersResponse, true);
$senderEmail = 'aff526001@smtp-brevo.com'; // default fallback
if (is_array($sendersData) && isset($sendersData['senders'])) {
    foreach ($sendersData['senders'] as $s) {
        if (isset($s['active']) && $s['active'] && isset($s['email'])) {
            $senderEmail = $s['email'];
            echo "Found active verified sender: $senderEmail\n";
            break;
        }
    }
}

// 3. Test sending email with the found sender
echo "\n--- TESTING EMAIL SENDING ---\n";
echo "Using Sender: $senderEmail\n";

$sendUrl = 'https://api.brevo.com/v3/smtp/email';
$postData = [
    'sender' => [
        'name' => 'SocialAI',
        'email' => $senderEmail
    ],
    'to' => [
        [
            'email' => 'chaychaupal@gmail.com',
            'name' => 'ChayChaupal Test'
        ]
    ],
    'subject' => 'SocialAI Live Test Email',
    'htmlContent' => '<h1>Live Test</h1><p>Testing Brevo API with sender ' . htmlspecialchars($senderEmail) . ' from media.chaychaupal.com.</p>'
];

$ch = curl_init($sendUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'accept: application/json',
    'api-key: ' . $apiKey,
    'content-type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "HTTP CODE: $httpCode\n";
echo "CURL ERROR: $curlError\n";
echo "RESPONSE: $response\n";
