<?php
header('Content-Type: text/plain');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "--- DIAGNOSTICS ---\n";
echo "PHP Version: " . phpversion() . "\n";
echo "CURL Loaded: " . (extension_loaded('curl') ? 'YES' : 'NO') . "\n";

$apiKey = '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';
$url = 'https://api.brevo.com/v3/smtp/email';
$data = [
    'sender' => [
        'name' => 'SocialAI',
        'email' => 'aff526001@smtp-brevo.com'
    ],
    'to' => [
        [
            'email' => 'chaychaupal@gmail.com',
            'name' => 'ChayChaupal Test'
        ]
    ],
    'subject' => 'SocialAI Live Test Email',
    'htmlContent' => '<h1>Live Test</h1><p>Testing Brevo API from media.chaychaupal.com.</p>'
];

if (extension_loaded('curl')) {
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

    echo "HTTP CODE: $httpCode\n";
    echo "CURL ERROR: $curlError\n";
    echo "RESPONSE: $response\n";
} else {
    echo "cURL is NOT enabled on this server. Email cannot be sent via REST API.\n";
}
