<?php
/**
 * Posts API → posts table
 * 
 * GET    /api/posts.php                     → List all posts
 * GET    /api/posts.php?action=analytics    → Analytics summary
 * GET    /api/posts.php?id=1                → Single post
 * POST   /api/posts.php                     → Create new post
 * PUT    /api/posts.php?id=1                → Update post
 * DELETE /api/posts.php?id=1                → Delete post
 * POST   /api/posts.php?action=publish&id=1 → Publish post
 */

require_once __DIR__ . '/lib/response.php';
require_once __DIR__ . '/config/database.php';

sendCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = getQueryAction();
$id     = getQueryId();

// ============================================
// GET - List posts or analytics or single post
// ============================================
if ($method === 'GET') {

    // Analytics summary
    if ($action === 'analytics' || $action === 'summary') {
        getAnalytics();
    }

    // Single post
    if ($id) {
        getSinglePost($id);
    }

    // List posts
    getPosts();
}

// ============================================
// POST - Create post or publish
// ============================================
elseif ($method === 'POST') {

    // Publish
    if ($action === 'publish' && $id) {
        publishPost($id);
    }

    // Create
    createPost();
}

// ============================================
// PUT - Update post
// ============================================
elseif ($method === 'PUT') {
    updatePost($id);
}

// ============================================
// DELETE - Remove post
// ============================================
elseif ($method === 'DELETE') {
    deletePost($id);
}

// ============================================
// HANDLERS
// ============================================

function getPosts(): void {
    global $db;

    try {
        $status     = $_GET['status'] ?? null;
        $platform   = $_GET['platform'] ?? null;
        $page       = max(1, intval($_GET['page'] ?? 1));
        $limit      = min(50, max(1, intval($_GET['limit'] ?? 20)));
        $offset     = ($page - 1) * $limit;
        $businessId = getBusinessId();

        $where  = "WHERE p.business_id = ?";
        $params = [$businessId];

        if ($status) {
            $where   .= " AND p.status = ?";
            $params[] = $status;
        }

        $total = $db->fetchOne(
            "SELECT COUNT(*) as cnt FROM posts p $where",
            $params
        )['cnt'] ?? 0;

        $posts = $db->fetchAll(
            "SELECT p.* FROM posts p $where ORDER BY p.created_at DESC LIMIT $limit OFFSET $offset",
            $params
        );

        // Parse JSON fields
        foreach ($posts as &$post) {
            $post = formatPost($post);
        }

        jsonSuccess([
            'posts'      => $posts,
            'total'      => intval($total),
            'page'       => $page,
            'totalPages' => ceil($total / $limit)
        ]);

    } catch (Exception $e) {
        jsonError('Failed to fetch posts', 500);
    }
}

function getSinglePost(int $id): void {
    global $db;

    try {
        $post = $db->fetchOne("SELECT * FROM posts WHERE id = ?", [$id]);

        if (!$post) {
            jsonError('Post not found', 404);
        }

        $post = formatPost($post);
        jsonSuccess(['post' => $post]);

    } catch (Exception $e) {
        jsonError('Post not found', 404);
    }
}

function getAnalytics(): void {
    global $db;

    try {
        $businessId = getBusinessId();

        $stats = $db->fetchAll(
            "SELECT status, COUNT(*) as count FROM posts WHERE business_id = ? GROUP BY status",
            [$businessId]
        );

        $totalPosts = $db->fetchOne(
            "SELECT COUNT(*) as cnt FROM posts WHERE business_id = ?",
            [$businessId]
        )['cnt'] ?? 0;

        $recentPosts = $db->fetchAll(
            "SELECT * FROM posts WHERE business_id = ? ORDER BY created_at DESC LIMIT 5",
            [$businessId]
        );
        foreach ($recentPosts as &$p) $p = formatPost($p);

        jsonSuccess([
            'stats'       => $stats,
            'totalPosts'  => intval($totalPosts),
            'recentPosts' => $recentPosts
        ]);

    } catch (Exception $e) {
        jsonError('Failed to fetch analytics', 500);
    }
}

function createPost(): void {
    global $db;

    try {
        $input      = getJsonInput();
        $businessId = $input['business_id'] ?? $input['businessId'] ?? getBusinessId();
        $prompt     = $input['prompt']     ?? '';
        $caption    = $input['caption']    ?? '';
        $hashtags   = $input['hashtags']   ?? [];
        $imageUrl   = $input['imageUrl']   ?? $input['image_url']   ?? '';
        $imagePrompt= $input['imagePrompt']?? $input['image_prompt'] ?? '';
        $videoScript= $input['videoScript']?? $input['video_script'] ?? '';
        $platforms  = $input['platforms']  ?? ['instagram'];
        $status     = $input['status']     ?? 'published';
        $language   = $input['language']   ?? 'hi';
        $scheduledAt= $input['scheduledAt']?? $input['scheduled_at'] ?? null;

        if (empty($prompt) && empty($caption)) {
            jsonError('Caption or prompt required');
        }

        $id = $db->insert(
            "INSERT INTO posts (business_id, prompt, caption, hashtags, image_url, image_prompt, video_script, platforms, status, scheduled_at, published_at, language)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $businessId,
                $prompt,
                $caption,
                json_encode($hashtags),
                $imageUrl,
                $imagePrompt,
                $videoScript,
                json_encode($platforms),
                $status,
                $scheduledAt,
                $status === 'published' ? date('Y-m-d H:i:s') : null,
                $language
            ]
        );

        $post = $db->fetchOne("SELECT * FROM posts WHERE id = ?", [$id]);
        $post = formatPost($post);

        jsonSuccess([
            'message' => "🚀 Posted to " . count($platforms) . " platform(s)!",
            'post'    => $post
        ], 201);

    } catch (Exception $e) {
        jsonError('Failed to create post', 500);
    }
}

function updatePost(?int $id): void {
    global $db;
    if (!$id) jsonError('Post ID required');

    try {
        $allowedFields = ['caption', 'hashtags', 'platforms', 'status', 'scheduled_at', 'language'];
        $input         = getJsonInput();

        $fields = [];
        $params = [];

        foreach ($allowedFields as $field) {
            // Map camelCase → snake_case
            $inputKey = match($field) {
                'scheduled_at' => 'scheduledAt',
                default        => $field
            };

            if (array_key_exists($inputKey, $input) || array_key_exists($field, $input)) {
                $value = $input[$inputKey] ?? $input[$field];
                // JSON encode array fields
                if (in_array($field, ['hashtags', 'platforms']) && is_array($value)) {
                    $value = json_encode($value);
                }
                $fields[] = "`$field` = ?";
                $params[] = $value;
            }
        }

        if (empty($fields)) {
            jsonError('No valid fields to update');
        }

        $params[] = $id;
        $db->execute(
            "UPDATE posts SET " . implode(', ', $fields) . " WHERE id = ?",
            $params
        );

        $post = $db->fetchOne("SELECT * FROM posts WHERE id = ?", [$id]);
        $post = formatPost($post);

        jsonSuccess(['post' => $post]);

    } catch (Exception $e) {
        jsonError($e->getMessage(), 500);
    }
}

function deletePost(?int $id): void {
    global $db;
    if (!$id) jsonError('Post ID required');

    try {
        $deleted = $db->execute("DELETE FROM posts WHERE id = ?", [$id]);

        if ($deleted === 0) {
            jsonError('Post not found', 404);
        }

        jsonSuccess(['message' => 'Post deleted']);

    } catch (Exception $e) {
        jsonError($e->getMessage(), 500);
    }
}

function publishPost(int $id): void {
    global $db;

    try {
        $post = $db->fetchOne("SELECT * FROM posts WHERE id = ?", [$id]);
        if (!$post) jsonError('Post not found', 404);

        $platforms = json_decode($post['platforms'] ?? '[]', true) ?: ['instagram'];

        $publishedPlatforms = array_map(function($p) {
            return ['platform' => $p, 'success' => true, 'postId' => "sim_{$p}_" . time()];
        }, $platforms);

        $db->execute(
            "UPDATE posts SET status = 'published', published_at = NOW() WHERE id = ?",
            [$id]
        );

        $updated = $db->fetchOne("SELECT * FROM posts WHERE id = ?", [$id]);
        $updated = formatPost($updated);

        jsonSuccess([
            'post'               => $updated,
            'publishedPlatforms' => $publishedPlatforms
        ]);

    } catch (Exception $e) {
        jsonError($e->getMessage(), 500);
    }
}

// ============================================
// HELPERS
// ============================================

function formatPost(array $row): array {
    return [
        '_id'                  => (string)$row['id'],
        'id'                   => (string)$row['id'],
        'business_id'          => $row['business_id'] ?? 1,
        'prompt'               => $row['prompt'] ?? '',
        'caption'              => $row['caption'] ?? '',
        'hashtags'             => parseJsonArray($row['hashtags'] ?? '[]'),
        'imageUrl'             => $row['image_url'] ?? null,
        'image_url'            => $row['image_url'] ?? null,
        'imagePrompt'          => $row['image_prompt'] ?? null,
        'image_prompt'         => $row['image_prompt'] ?? null,
        'videoScript'          => $row['video_script'] ?? null,
        'video_script'         => $row['video_script'] ?? null,
        'video_details'        => parseJsonArray($row['video_details'] ?? '{}'),
        'alternative_captions' => parseJsonArray($row['alternative_captions'] ?? '[]'),
        'best_time_to_post'    => $row['best_time_to_post'] ?? null,
        'platforms'            => parseJsonArray($row['platforms'] ?? '["instagram"]'),
        'status'               => $row['status'] ?? 'draft',
        'scheduledAt'          => $row['scheduled_at'] ?? null,
        'scheduled_at'         => $row['scheduled_at'] ?? null,
        'publishedAt'          => $row['published_at'] ?? null,
        'published_at'         => $row['published_at'] ?? null,
        'engagement'           => parseJsonArray($row['engagement'] ?? '{}'),
        'engagement_likes'     => parseJsonArray($row['engagement'] ?? '{}')['likes'] ?? 0,
        'engagement_comments'  => parseJsonArray($row['engagement'] ?? '{}')['comments'] ?? 0,
        'engagement_shares'    => parseJsonArray($row['engagement'] ?? '{}')['shares'] ?? 0,
        'engagement_views'     => parseJsonArray($row['engagement'] ?? '{}')['views'] ?? 0,
        'language'             => $row['language'] ?? 'hi',
        'category'             => $row['category'] ?? null,
        'createdAt'            => $row['created_at'] ?? null,
        'created_at'           => $row['created_at'] ?? null,
        'updatedAt'            => $row['updated_at'] ?? null,
        'updated_at'           => $row['updated_at'] ?? null,
    ];
}

function parseJsonArray($value): array {
    if (is_string($value)) {
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }
    return is_array($value) ? $value : [];
}

