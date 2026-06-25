<?php
/**
 * Media Upload API
 * Handles saving uploaded images/videos to local storage
 * POST /api/upload.php
 */

require_once __DIR__ . '/lib/response.php';

sendCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('POST request required');
}

if (!isset($_FILES['file'])) {
    jsonError('No file uploaded');
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    jsonError('File upload error: ' . $file['error']);
}

// Limit size to 50MB
if ($file['size'] > 50 * 1024 * 1024) {
    jsonError('File too large (max 50MB)');
}

$uploadsDir = __DIR__ . '/uploads';
if (!is_dir($uploadsDir)) {
    if (!mkdir($uploadsDir, 0755, true)) {
        jsonError('Failed to create uploads directory');
    }
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

// Simple validation of file types
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'webm', 'ogg'];
if (!in_array($ext, $allowedExtensions)) {
    jsonError('Unsupported file format. Supported formats: JPG, PNG, GIF, MP4, MOV, WEBM');
}

// Generate unique safe name
$filename = uniqid('media_', true) . '.' . $ext;
$targetPath = $uploadsDir . '/' . $filename;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    // Return the relative URL which goes through proxy /api/uploads/
    jsonSuccess([
        'url' => '/api/uploads/' . $filename
    ]);
} else {
    jsonError('Failed to save uploaded file on server');
}
