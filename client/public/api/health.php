<?php
/**
 * Health Check Endpoint
 * GET /api/health
 */

require_once __DIR__ . '/lib/response.php';
require_once __DIR__ . '/config/database.php';

sendCorsHeaders();

try {
    $db->fetchOne("SELECT 1");
    $dbStatus = 'connected';
} catch (Exception $e) {
    $dbStatus = 'disconnected';
}

jsonSuccess([
    'status'    => 'ok',
    'service'   => 'SocialAI - Social Media Manager API',
    'version'   => '2.0.0',
    'stack'     => 'PHP + MySQL',
    'database'  => $dbStatus,
    'timezone'  => 'Asia/Kolkata (IST)',
    'timestamp' => date('c'),
]);
