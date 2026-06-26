<?php
/**
 * Common response & CORS helpers
 * Shared across all API files
 */

function sendCorsHeaders(): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Gemini-Key, X-OpenAI-Key, X-Text-Model, X-Image-Model');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

function jsonSuccess(array $data = [], int $code = 200): void {
    http_response_code($code);
    echo json_encode(array_merge(['success' => true], $data), JSON_UNESCAPED_UNICODE);
    exit();
}

function jsonError(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit();
}



function getJsonInput(): array {
    static $input = null;
    if ($input === null) {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $input = is_array($data) ? $data : [];
    }
    return $input;
}

function getQueryId(): ?int {
    $id = $_GET['id'] ?? null;
    return $id ? intval($id) : null;
}

function getQueryAction(): ?string {
    return $_GET['action'] ?? null;
}

function getBusinessId(): int {
    $id = $_GET['business_id'] ?? $_POST['business_id'] ?? null;
    if ($id === null) {
        $json = getJsonInput();
        $id = $json['business_id'] ?? $json['businessId'] ?? $json['id'] ?? null;
    }
    return intval($id ?: 1);
}
