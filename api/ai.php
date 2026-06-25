<?php
/**
 * AI Generation API
 * 
 * POST /api/ai.php?action=generate-all       → Caption + Hashtags + Image + Video
 * POST /api/ai.php?action=generate-text       → Caption + Hashtags only
 * POST /api/ai.php?action=generate-image      → Image only
 * POST /api/ai.php?action=generate-video      → Video script only
 * POST /api/ai.php?action=platform-variations → Platform-specific variations
 */

require_once __DIR__ . '/lib/response.php';
require_once __DIR__ . '/config/database.php';

sendCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = getQueryAction();

if ($method !== 'POST') {
    jsonError('POST required for AI generation');
}

$input = getJsonInput();

// Get client AI options from headers
$geminiKey = $_SERVER['HTTP_X_GEMINI_KEY'] ?? $_SERVER['HTTP_X_Gemini_Key'] ?? null;
$openaiKey = $_SERVER['HTTP_X_OPENAI_KEY'] ?? $_SERVER['HTTP_X_Openai_Key'] ?? null;
$textModel = $_SERVER['HTTP_X_TEXT_MODEL'] ?? $_SERVER['HTTP_X_Text_Model'] ?? 'gpt-4';
$imageModel = $_SERVER['HTTP_X_IMAGE_MODEL'] ?? $_SERVER['HTTP_X_Image_Model'] ?? 'dall-e-3';

// Fallback to database configuration if headers are missing
$businessId = $input['business_id'] ?? $input['businessId'] ?? getBusinessId();
if (empty($geminiKey) || empty($openaiKey) || $textModel === 'gpt-4' || $imageModel === 'dall-e-3') {
    $biz = $db->fetchOne("SELECT ai_config FROM businesses WHERE id = ?", [$businessId]);
    if ($biz && !empty($biz['ai_config'])) {
        $aiC = json_decode($biz['ai_config'], true);
        if (is_array($aiC)) {
            if (empty($geminiKey) && !empty($aiC['geminiApiKey'])) {
                $geminiKey = $aiC['geminiApiKey'];
            }
            if (empty($openaiKey) && !empty($aiC['openaiApiKey'])) {
                $openaiKey = $aiC['openaiApiKey'];
            }
            if (($textModel === 'gpt-4' || empty($textModel)) && !empty($aiC['textModel'])) {
                $textModel = $aiC['textModel'];
            }
            if (($imageModel === 'dall-e-3' || empty($imageModel)) && !empty($aiC['imageModel'])) {
                $imageModel = $aiC['imageModel'];
            }
        }
    }
}

$options = [
    'geminiKey'  => $geminiKey,
    'openaiKey'  => $openaiKey,
    'textModel'  => $textModel,
    'imageModel' => $imageModel,
];

// ============================================
// ROUTER
// ============================================
switch ($action) {
    case 'generate-all':
        handleGenerateAll($input, $options);
        break;
    case 'generate-text':
        handleGenerateText($input, $options);
        break;
    case 'generate-image':
        handleGenerateImage($input, $options);
        break;
    case 'generate-video':
        handleGenerateVideo($input, $options);
        break;
    case 'platform-variations':
        handlePlatformVariations($input);
        break;
    default:
        // Default: treat as generate-all
        handleGenerateAll($input, $options);
}

// ============================================
// HANDLERS
// ============================================

function handleGenerateAll(array $input, array $options): void {
    global $db;

    $prompt    = trim($input['prompt'] ?? '');
    $language  = $input['language'] ?? 'hi';
    $tone      = $input['tone'] ?? 'casual';
    $platforms = $input['platforms'] ?? ['instagram'];
    $scheduleAt= $input['scheduleAt'] ?? $input['schedule_at'] ?? null;
    $businessId= $input['business_id'] ?? $input['businessId'] ?? getBusinessId();

    if (strlen($prompt) < 3) {
        jsonError('Please provide a prompt (at least 3 characters)');
    }

    try {
        $textResult    = generateCaption($prompt, $language, $tone, $platforms, $options);
        $imageResult   = generateImage($prompt, $language, $options);
        $videoResult   = generateVideoScript($prompt, $language, $textResult['caption'] ?? '', $options);

        // Save to DB
        $status = $scheduleAt ? 'scheduled' : 'draft';

        $postId = $db->insert(
            "INSERT INTO posts (business_id, prompt, caption, hashtags, image_url, image_prompt,
             video_script, video_details, alternative_captions, best_time_to_post, platforms,
             status, scheduled_at, language)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $businessId,
                $prompt,
                $textResult['caption'] ?? '',
                json_encode($textResult['hashtags'] ?? []),
                $imageResult['imageUrl'] ?? $imageResult['image_url'] ?? null,
                $imageResult['imagePrompt'] ?? $imageResult['image_prompt'] ?? null,
                $videoResult['script'] ?? $videoResult['video_script'] ?? null,
                json_encode([
                    'idea'             => $videoResult['idea'] ?? $videoResult['videoIdea'] ?? '',
                    'videoPrompt'      => $videoResult['videoPrompt'] ?? '',
                    'scenes'           => $videoResult['scenes'] ?? [],
                    'duration'         => $videoResult['duration'] ?? '',
                    'musicSuggestion'  => $videoResult['musicSuggestion'] ?? '',
                ]),
                json_encode($textResult['alternatives'] ?? []),
                $textResult['bestTimeToPost'] ?? null,
                json_encode($platforms),
                $status,
                $scheduleAt,
                $language
            ]
        );

        jsonSuccess([
            'postId'            => (string)$postId,
            'originalPrompt'    => $prompt,
            'caption'           => $textResult['caption'] ?? '',
            'hashtags'          => $textResult['hashtags'] ?? [],
            'imageUrl'          => $imageResult['imageUrl'] ?? $imageResult['image_url'] ?? null,
            'imagePrompt'       => $imageResult['imagePrompt'] ?? $imageResult['image_prompt'] ?? null,
            'videoScript'       => $videoResult['script'] ?? $videoResult['videoScript'] ?? null,
            'videoIdea'         => $videoResult['idea'] ?? $videoResult['videoIdea'] ?? '',
            'videoPrompt'       => $videoResult['videoPrompt'] ?? '',
            'scenes'            => $videoResult['scenes'] ?? [],
            'duration'          => $videoResult['duration'] ?? '',
            'musicSuggestion'   => $videoResult['musicSuggestion'] ?? '',
            'bestTimeToPost'    => $textResult['bestTimeToPost'] ?? '',
            'alternativeCaptions'=> $textResult['alternatives'] ?? [],
            'cta'               => $textResult['cta'] ?? '',
        ]);

    } catch (Exception $e) {
        jsonError('AI generation failed: ' . $e->getMessage(), 500);
    }
}

function handleGenerateText(array $input, array $options): void {
    $prompt    = trim($input['prompt'] ?? '');
    $language  = $input['language'] ?? 'hi';
    $tone      = $input['tone'] ?? 'casual';
    $platforms = $input['platforms'] ?? ['instagram'];

    if (strlen($prompt) < 3) jsonError('Please provide a prompt (at least 3 characters)');

    $result = generateCaption($prompt, $language, $tone, $platforms, $options);
    jsonSuccess($result);
}

function handleGenerateImage(array $input, array $options): void {
    $prompt   = trim($input['prompt'] ?? '');
    $language = $input['language'] ?? 'hi';

    if (strlen($prompt) < 3) jsonError('Please provide a prompt');

    $result = generateImage($prompt, $language, $options);
    jsonSuccess($result);
}

function handleGenerateVideo(array $input, array $options): void {
    $prompt   = trim($input['prompt'] ?? '');
    $language = $input['language'] ?? 'hi';
    $caption  = $input['caption'] ?? '';

    if (strlen($prompt) < 3) jsonError('Please provide a prompt');

    $result = generateVideoScript($prompt, $language, $caption, $options);
    jsonSuccess($result);
}

function handlePlatformVariations(array $input): void {
    // Simple platform-specific caption tweaks
    $caption   = $input['caption'] ?? '';
    $hashtags  = $input['hashtags'] ?? [];
    $platforms = $input['platforms'] ?? ['instagram'];

    $variations = [];
    foreach ($platforms as $p) {
        $variations[$p] = [
            'caption'  => $caption,
            'hashtags' => $hashtags,
        ];
    }

    jsonSuccess(['variations' => $variations]);
}

// ============================================
// AI GENERATION FUNCTIONS
// ============================================

function generateCaption(string $prompt, string $language, string $tone, array $platforms, array $options): array {
    $model = $options['textModel'] ?? 'gpt-4';

    // Try Gemini
    if (str_contains($model, 'gemini') && !empty($options['geminiKey'])) {
        return callGeminiText($prompt, $language, $tone, $platforms, $options['geminiKey']);
    }

    // Try OpenAI
    if (!empty($options['openaiKey'])) {
        return callOpenAIText($prompt, $language, $tone, $platforms, $options['openaiKey']);
    }

    throw new Exception('No AI API key configured. Please set Gemini or OpenAI API key in Brand Settings.');
}

function generateImage(string $prompt, string $language, array $options): array {
    $model = $options['imageModel'] ?? 'dall-e-3';

    // Try DALL-E via OpenAI
    if (!empty($options['openaiKey'])) {
        return callDalleE($prompt, $language, $options['openaiKey']);
    }

    throw new Exception('No AI image API key configured. Please set OpenAI API key in Brand Settings.');
}

function generateVideoScript(string $prompt, string $language, string $caption, array $options): array {
    $model = $options['textModel'] ?? 'gpt-4';

    if (str_contains($model, 'gemini') && !empty($options['geminiKey'])) {
        return callGeminiVideo($prompt, $language, $caption, $options['geminiKey']);
    }

    if (!empty($options['openaiKey'])) {
        return callOpenAIVideo($prompt, $language, $caption, $options['openaiKey']);
    }

    throw new Exception('No AI API key configured. Please set Gemini or OpenAI API key in Brand Settings.');
}

// ============================================
// AI API CALLS
// ============================================

function callGeminiText(string $prompt, string $language, string $tone, array $platforms, string $apiKey): array {
    $langInstr = $language === 'hi' ? 'Hindi (हिंदी) में, Hinglish style use kar sakte ho' : 'English';

    $systemInstruction = "You are an expert social media content creator. Generate content in $langInstr.
Tone: $tone. Platforms: " . implode(', ', $platforms) . ".
Return a JSON object with:
{
  \"caption\": \"main caption (150-300 chars, engaging, with emojis)\",
  \"hashtags\": [\"#tag1\", \"#tag2\", ...] (15-20 relevant hashtags),
  \"alternatives\": [\"alt caption 1\", \"alt caption 2\"],
  \"bestTimeToPost\": \"suggested best posting time\",
  \"cta\": \"call to action\"
}";

    return callGeminiAPI($apiKey, $systemInstruction, "Create social media content for: \"$prompt\"");
}

function callGeminiVideo(string $prompt, string $language, string $caption, string $apiKey): array {
    $langInstr = $language === 'hi' ? 'Hindi/Hinglish' : 'English';

    $systemInstruction = "You are a professional short-form video script writer. Generate in $langInstr.
Return a JSON object with:
{
  \"idea\": \"one-line video concept\",
  \"script\": \"scene-by-scene script (15-30 seconds)\",
  \"videoPrompt\": \"prompt for AI video generation tool\",
  \"duration\": \"suggested duration in seconds\",
  \"musicSuggestion\": \"type of background music\",
  \"scenes\": [\"scene 1 description\", \"scene 2 description\", \"scene 3 description\"]
}";

    return callGeminiAPI($apiKey, $systemInstruction, "Create video script for: \"$prompt\". Caption: \"" . substr($caption, 0, 100) . "\"");
}

function callGeminiAPI(string $apiKey, string $systemInstruction, string $userPrompt): array {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$apiKey";

    $payload = [
        'contents' => [
            ['role' => 'user', 'parts' => [['text' => $userPrompt]]]
        ],
        'systemInstruction' => [
            'parts' => [['text' => $systemInstruction]]
        ],
        'generationConfig' => [
            'responseMimeType' => 'application/json'
        ]
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception("Gemini API error: HTTP $httpCode");
    }

    $data = json_decode($response, true);
    $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
    $cleanJson = trim(str_replace(['```json', '```'], '', $text));

    return json_decode($cleanJson, true) ?: [];
}

function callOpenAIText(string $prompt, string $language, string $tone, array $platforms, string $apiKey): array {
    $langInstr = $language === 'hi' ? 'Hindi (हिंदी) में, Hinglish style use kar sakte ho' : 'English';

    $payload = [
        'model'       => 'gpt-4',
        'messages'    => [
            ['role' => 'system', 'content' => "You are an expert social media content creator. Generate in $langInstr. Tone: $tone. Platforms: " . implode(', ', $platforms) . ". Return JSON: {\"caption\":\"...\",\"hashtags\":[...],\"alternatives\":[...],\"bestTimeToPost\":\"...\",\"cta\":\"...\"}"],
            ['role' => 'user', 'content' => "Create social media content for: \"$prompt\""]
        ],
        'response_format' => ['type' => 'json_object'],
        'temperature'     => 0.8,
        'max_tokens'      => 1000,
    ];

    $result = callOpenAI($apiKey, $payload);
    return json_decode($result['choices'][0]['message']['content'] ?? '{}', true) ?: [];
}

function callOpenAIVideo(string $prompt, string $language, string $caption, string $apiKey): array {
    $langInstr = $language === 'hi' ? 'Hindi/Hinglish' : 'English';

    $payload = [
        'model'       => 'gpt-4',
        'messages'    => [
            ['role' => 'system', 'content' => "You are a professional video content creator. Language: $langInstr. Return JSON: {\"idea\":\"...\",\"script\":\"...\",\"videoPrompt\":\"...\",\"duration\":\"...\",\"musicSuggestion\":\"...\",\"scenes\":[...]}"],
            ['role' => 'user', 'content' => "Create video script for: \"$prompt\". Caption: \"" . substr($caption, 0, 100) . "\""]
        ],
        'response_format' => ['type' => 'json_object'],
        'temperature'     => 0.8,
        'max_tokens'      => 800,
    ];

    $result = callOpenAI($apiKey, $payload);
    return json_decode($result['choices'][0]['message']['content'] ?? '{}', true) ?: [];
}

function callDalleE(string $prompt, string $language, string $apiKey): array {
    // Step 1: Generate optimized image prompt
    $promptPayload = [
        'model'       => 'gpt-4',
        'messages'    => [
            ['role' => 'system', 'content' => "Create a detailed DALL-E 3 image prompt. Language: " . ($language === 'hi' ? 'Indian context' : 'Global context') . ". Return JSON: {\"imagePrompt\":\"...\",\"style\":\"...\"}"],
            ['role' => 'user', 'content' => "Generate image prompt for: \"$prompt\""]
        ],
        'response_format' => ['type' => 'json_object'],
        'max_tokens'      => 300,
    ];

    $promptResult = callOpenAI($apiKey, $promptPayload);
    $imgPrompt = json_decode($promptResult['choices'][0]['message']['content'] ?? '{}', true)['imagePrompt'] ?? $prompt;

    // Step 2: Generate image via DALL-E 3
    $imgPayload = [
        'model'  => 'dall-e-3',
        'prompt' => $imgPrompt,
        'n'      => 1,
        'size'   => '1024x1024',
        'quality'=> 'standard',
    ];

    $imgResult = callOpenAI($apiKey, $imgPayload, 'https://api.openai.com/v1/images/generations');

    return [
        'imageUrl'    => $imgResult['data'][0]['url'] ?? '',
        'imagePrompt' => $imgPrompt
    ];
}

function callOpenAI(string $apiKey, array $payload, string $url = 'https://api.openai.com/v1/chat/completions'): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            "Authorization: Bearer $apiKey"
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 60,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception("OpenAI API error: HTTP $httpCode");
    }

    return json_decode($response, true) ?: [];
}


