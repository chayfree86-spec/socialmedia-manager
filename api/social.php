<?php
/**
 * Social Accounts API → social_accounts table
 * 
 * GET    /api/social.php?business_id=1         → List accounts
 * GET    /api/social.php?action=summary         → Platform summary
 * GET    /api/social.php?id=1                   → Single account
 * POST   /api/social.php?action=connect         → Connect new account
 * PUT    /api/social.php?id=1                   → Update account
 * DELETE /api/social.php?id=1                   → Disconnect account
 * 
 * 🔐 Sensitive fields (access_token, refresh_token, app_secret) → AES-256-GCM encrypted
 */

require_once __DIR__ . '/lib/response.php';
require_once __DIR__ . '/lib/encryption.php';
require_once __DIR__ . '/config/database.php';

sendCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = getQueryAction();
$id     = getQueryId();

// ============================================
// GET - List / Single / Summary
// ============================================
if ($method === 'GET') {

    if ($action === 'summary' || $action === 'platforms') {
        getPlatformSummary();
    }

    if ($id) {
        getSingleAccount($id);
    }

    getAccounts();
}

// ============================================
// POST - Connect new account
// ============================================
elseif ($method === 'POST') {

    if ($action === 'connect') {
        connectAccount();
    }

    // Also support creating via plain POST
    connectAccount();
}

// ============================================
// PUT - Update account
// ============================================
elseif ($method === 'PUT') {
    updateAccount($id);
}

// ============================================
// DELETE - Disconnect
// ============================================
elseif ($method === 'DELETE') {
    disconnectAccount($id);
}

// ============================================
// HANDLERS
// ============================================

function getAccounts(): void {
    global $db;

    try {
        $platform   = $_GET['platform'] ?? null;
        $status     = $_GET['status'] ?? null;
        $businessId = getBusinessId();

        $where  = "WHERE business_id = ? AND is_active = 1";
        $params = [$businessId];

        if ($platform) {
            $where   .= " AND platform = ?";
            $params[] = $platform;
        }
        if ($status) {
            $where   .= " AND status = ?";
            $params[] = $status;
        }

        $accounts = $db->fetchAll(
            "SELECT * FROM social_accounts $where ORDER BY created_at DESC",
            $params
        );

        // Decrypt tokens & format
        foreach ($accounts as &$acc) {
            $acc = formatSocialAccount($acc);
        }

        jsonSuccess(['accounts' => $accounts, 'total' => count($accounts)]);

    } catch (Exception $e) {
        jsonError('Failed to fetch accounts', 500);
    }
}

function getSingleAccount(int $id): void {
    global $db;

    try {
        $acc = $db->fetchOne("SELECT * FROM social_accounts WHERE id = ?", [$id]);
        if (!$acc) jsonError('Account not found', 404);

        $acc = formatSocialAccount($acc);
        jsonSuccess(['account' => $acc]);

    } catch (Exception $e) {
        jsonError('Account not found', 404);
    }
}

function getPlatformSummary(): void {
    global $db;

    try {
        $businessId = getBusinessId();
        $accounts = $db->fetchAll(
            "SELECT id, platform, account_name, status FROM social_accounts 
             WHERE business_id = ? AND is_active = 1",
            [$businessId]
        );

        $summary = ['totalConnected' => 0, 'platforms' => []];
        $allPlatforms = ['instagram','facebook','youtube','whatsapp','google_business','pinterest','linkedin','twitter','tiktok','threads','custom_platform'];

        foreach ($allPlatforms as $p) {
            $found = current(array_filter($accounts, fn($a) => $a['platform'] === $p && $a['status'] === 'connected'));
            $summary['platforms'][$p] = $found
                ? ['connected' => true, 'accountId' => (string)$found['id'], 'name' => $found['account_name']]
                : ['connected' => false];
            if ($found) $summary['totalConnected']++;
        }

        jsonSuccess(['summary' => $summary]);

    } catch (Exception $e) {
        jsonError('Failed to fetch platform summary', 500);
    }
}

function connectAccount(): void {
    global $db;

    try {
        $input      = getJsonInput();
        $businessId = $input['business_id'] ?? $input['businessId'] ?? getBusinessId();
        $platform   = $input['platform']     ?? '';
        $accountName= $input['accountName']  ?? $input['account_name'] ?? '';

        if (empty($platform) || empty($accountName)) {
            jsonError('Platform aur Account Name required hain');
        }

        // Check duplicate
        $existing = $db->fetchOne(
            "SELECT id FROM social_accounts WHERE business_id = ? AND platform = ?",
            [$businessId, $platform]
        );
        if ($existing) {
            jsonError("Ye $platform account pehle se connected hai.", 409);
        }

        // Encrypt sensitive fields
        $accessTokenEnc  = Encryption::encryptForDb($input['accessToken']  ?? $input['access_token']  ?? '');
        $refreshTokenEnc = Encryption::encryptForDb($input['refreshToken'] ?? $input['refresh_token'] ?? '');
        $appSecretEnc    = Encryption::encryptForDb($input['appSecret']    ?? $input['app_secret']    ?? '');

        $id = $db->insert(
            "INSERT INTO social_accounts 
                (business_id, platform, account_name, account_id, profile_url, profile_image,
                 access_token, token_expiry, refresh_token, app_id, app_secret,
                 encryption_iv, encryption_tag, status, stats, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $businessId,
                $platform,
                $accountName,
                $input['accountId']     ?? $input['account_id']     ?? ('manual_' . time()),
                $input['profileUrl']    ?? $input['profile_url']    ?? '',
                $input['profileImage']  ?? $input['profile_image']  ?? '',
                $accessTokenEnc['encrypted'],
                $input['tokenExpiry']   ?? $input['token_expiry']   ?? null,
                $refreshTokenEnc['encrypted'],
                $input['appId']         ?? $input['app_id']         ?? '',
                $appSecretEnc['encrypted'],
                $accessTokenEnc['encryption_iv'],   // Store same IV for all 3 encrypted fields
                $accessTokenEnc['encryption_tag'],  // Store same tag
                'connected',
                json_encode(['followers' => 0, 'following' => 0, 'posts' => 0]),
                $input['notes'] ?? ''
            ]
        );

        $account = $db->fetchOne("SELECT * FROM social_accounts WHERE id = ?", [$id]);
        $account = formatSocialAccount($account);

        jsonSuccess([
            'message' => "✅ $platform account connect ho gaya!",
            'account' => $account
        ], 201);

    } catch (Exception $e) {
        jsonError('Failed to connect account', 500);
    }
}

function updateAccount(?int $id): void {
    global $db;
    if (!$id) jsonError('Account ID required');

    try {
        $input = getJsonInput();
        $allowedFields = ['account_name', 'profile_url', 'profile_image', 'token_expiry', 'app_id', 'status', 'is_active', 'notes', 'stats'];
        $fields = [];
        $params = [];

        foreach ($allowedFields as $field) {
            $inputKey = match($field) {
                'account_name'  => 'accountName',
                'profile_url'   => 'profileUrl',
                'profile_image' => 'profileImage',
                'token_expiry'  => 'tokenExpiry',
                'app_id'        => 'appId',
                'is_active'     => 'isActive',
                default         => $field
            };

            if (array_key_exists($inputKey, $input) || array_key_exists($field, $input)) {
                $value = $input[$inputKey] ?? $input[$field];
                if ($field === 'stats' && is_array($value)) $value = json_encode($value);
                if ($field === 'is_active') $value = $value ? 1 : 0;
                $fields[] = "`$field` = ?";
                $params[] = $value;
            }
        }

        // Encrypt new tokens if provided
        if (!empty($input['accessToken'] ?? $input['access_token'] ?? '')) {
            $enc = Encryption::encryptForDb($input['accessToken'] ?? $input['access_token']);
            $fields[] = "`access_token` = ?"; $params[] = $enc['encrypted'];
            $fields[] = "`encryption_iv` = ?"; $params[] = $enc['encryption_iv'];
            $fields[] = "`encryption_tag` = ?"; $params[] = $enc['encryption_tag'];
        }
        if (!empty($input['refreshToken'] ?? $input['refresh_token'] ?? '')) {
            $enc = Encryption::encryptForDb($input['refreshToken'] ?? $input['refresh_token']);
            $fields[] = "`refresh_token` = ?"; $params[] = $enc['encrypted'];
        }
        if (!empty($input['appSecret'] ?? $input['app_secret'] ?? '')) {
            $enc = Encryption::encryptForDb($input['appSecret'] ?? $input['app_secret']);
            $fields[] = "`app_secret` = ?"; $params[] = $enc['encrypted'];
        }

        if (empty($fields)) jsonError('No valid fields to update');

        $params[] = $id;
        $db->execute(
            "UPDATE social_accounts SET " . implode(', ', $fields) . " WHERE id = ?",
            $params
        );

        $account = $db->fetchOne("SELECT * FROM social_accounts WHERE id = ?", [$id]);
        $account = formatSocialAccount($account);

        jsonSuccess(['message' => 'Updated!', 'account' => $account]);

    } catch (Exception $e) {
        jsonError($e->getMessage(), 500);
    }
}

function disconnectAccount(?int $id): void {
    global $db;
    if (!$id) jsonError('Account ID required');

    try {
        $acc = $db->fetchOne("SELECT platform FROM social_accounts WHERE id = ?", [$id]);
        if (!$acc) jsonError('Account not found', 404);

        $db->execute("DELETE FROM social_accounts WHERE id = ?", [$id]);

        jsonSuccess(['message' => "{$acc['platform']} disconnected"]);

    } catch (Exception $e) {
        jsonError($e->getMessage(), 500);
    }
}

// ============================================
// HELPERS
// ============================================

function formatSocialAccount(array $row): array {
    // Decrypt sensitive fields
    $accessToken  = Encryption::decryptFromDb($row['access_token'] ?? '', $row['encryption_iv'] ?? '', $row['encryption_tag'] ?? '');
    $refreshToken = Encryption::decryptFromDb($row['refresh_token'] ?? '', $row['encryption_iv'] ?? '', $row['encryption_tag'] ?? '');
    $appSecret    = Encryption::decryptFromDb($row['app_secret'] ?? '', $row['encryption_iv'] ?? '', $row['encryption_tag'] ?? '');

    $stats = parseJsonArray($row['stats'] ?? '{}');

    return [
        '_id'           => (string)$row['id'],
        'id'            => (string)$row['id'],
        'business_id'   => $row['business_id'] ?? 1,
        'platform'      => $row['platform'] ?? '',
        'accountName'   => $row['account_name'] ?? '',
        'account_name'  => $row['account_name'] ?? '',
        'accountId'     => $row['account_id'] ?? null,
        'account_id'    => $row['account_id'] ?? null,
        'profileUrl'    => $row['profile_url'] ?? null,
        'profile_url'   => $row['profile_url'] ?? null,
        'profileImage'  => $row['profile_image'] ?? null,
        'profile_image' => $row['profile_image'] ?? null,
        'accessToken'   => $accessToken,
        'access_token'  => $accessToken,
        'tokenExpiry'   => $row['token_expiry'] ?? null,
        'token_expiry'  => $row['token_expiry'] ?? null,
        'refreshToken'  => $refreshToken,
        'refresh_token' => $refreshToken,
        'appId'         => $row['app_id'] ?? null,
        'app_id'        => $row['app_id'] ?? null,
        'appSecret'     => $appSecret,
        'app_secret'    => $appSecret,
        'status'        => $row['status'] ?? 'connected',
        'followers'     => $stats['followers'] ?? 0,
        'following'     => $stats['following'] ?? 0,
        'posts_count'   => $stats['posts'] ?? 0,
        'stats'         => $stats,
        'isActive'      => (bool)($row['is_active'] ?? true),
        'is_active'     => (bool)($row['is_active'] ?? true),
        'notes'         => $row['notes'] ?? '',
        'userId'        => 'default-user',
        'createdAt'     => $row['created_at'] ?? null,
        'created_at'    => $row['created_at'] ?? null,
        'updatedAt'     => $row['updated_at'] ?? null,
        'updated_at'    => $row['updated_at'] ?? null,
    ];
}

function parseJsonArray($value): array {
    if (is_string($value)) {
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }
    return is_array($value) ? $value : [];
}

