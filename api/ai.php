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
    $imageUrl  = $input['imageUrl'] ?? $input['image_url'] ?? null;

    if (strlen($prompt) < 3) jsonError('Please provide a prompt (at least 3 characters)');

    $result = generateCaption($prompt, $language, $tone, $platforms, $options, $imageUrl);
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

function generateCaption(string $prompt, string $language, string $tone, array $platforms, array $options, ?string $imageUrl = null): array {
    $model = $options['textModel'] ?? 'gpt-4';

    if (isHashOrFilename($prompt)) {
        $prompt = "Describe this media and write an engaging social media post.";
    }

    // Use mock fallback if keys are missing or model is mock
    if ((empty($options['geminiKey']) && empty($options['openaiKey'])) || $model === 'mock') {
        return callMockText($prompt, $language, $tone, $platforms);
    }

    // Try Gemini
    if (str_contains($model, 'gemini') && !empty($options['geminiKey'])) {
        return callGeminiText($prompt, $language, $tone, $platforms, $options['geminiKey'], $imageUrl);
    }

    // Try OpenAI
    if (!empty($options['openaiKey'])) {
        return callOpenAIText($prompt, $language, $tone, $platforms, $options['openaiKey'], $imageUrl);
    }

    return callMockText($prompt, $language, $tone, $platforms);
}

function generateImage(string $prompt, string $language, array $options): array {
    $model = $options['imageModel'] ?? 'dall-e-3';

    if (isHashOrFilename($prompt)) {
        $prompt = "A high-quality engaging branding visual";
    }

    // Use mock fallback if keys are missing or model is mock
    if (empty($options['openaiKey']) || $model === 'mock') {
        return callMockImage($prompt, $language);
    }

    // Try DALL-E via OpenAI
    if (!empty($options['openaiKey'])) {
        return callDalleE($prompt, $language, $options['openaiKey']);
    }

    return callMockImage($prompt, $language);
}

function generateVideoScript(string $prompt, string $language, string $caption, array $options): array {
    $model = $options['textModel'] ?? 'gpt-4';

    if (isHashOrFilename($prompt)) {
        $prompt = "A high-quality engaging visual commercial";
    }

    // Use mock fallback if keys are missing or model is mock
    if ((empty($options['geminiKey']) && empty($options['openaiKey'])) || $model === 'mock') {
        return callMockVideo($prompt, $language, $caption);
    }

    if (str_contains($model, 'gemini') && !empty($options['geminiKey'])) {
        return callGeminiVideo($prompt, $language, $caption, $options['geminiKey']);
    }

    if (!empty($options['openaiKey'])) {
        return callOpenAIVideo($prompt, $language, $caption, $options['openaiKey']);
    }

    return callMockVideo($prompt, $language, $caption);
}

// ============================================
// AI API CALLS
// ============================================

function callGeminiText(string $prompt, string $language, string $tone, array $platforms, string $apiKey, ?string $imageUrl = null): array {
    if ($language === 'hi') {
        $langInstr = 'Hindi (हिंदी) with Hinglish elements';
    } elseif ($language === 'mix') {
        $langInstr = 'Mix of Hindi and English (natural modern Hinglish, e.g. "Kya aap ready hain?")';
    } else {
        $langInstr = 'English';
    }

    $systemInstruction = "You are an expert social media content creator. Generate content in $langInstr.
Tone: $tone. Platforms: " . implode(', ', $platforms) . ".
The generated caption must:
1. Start with an attention-grabbing hook.
2. Have a clear, conversational body with appropriate emojis.
3. End with a strong call-to-action (CTA).

Return a JSON object with EXACTLY this structure:
{
  \"caption\": \"The full engaging post caption with hook, body, and CTA included.\",
  \"hashtags\": [\"#tag1\", \"#tag2\", ...] (10-15 highly relevant hashtags),
  \"alternatives\": [\"alt caption 1\", \"alt caption 2\"],
  \"bestTimeToPost\": \"suggested best posting time (e.g. 6:00 PM)\",
  \"cta\": \"the specific call to action text used in the caption\"
}";

    $promptText = "Create social media content for: \"$prompt\"";
    if ($imageUrl) {
        $promptText .= ". Analyze the attached image to write relevant custom caption.";
    }

    return callGeminiAPI($apiKey, $systemInstruction, $promptText, $imageUrl);
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

function callGeminiAPI(string $apiKey, string $systemInstruction, string $userPrompt, ?string $imageUrl = null): array {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$apiKey";

    $parts = [['text' => $userPrompt]];

    if ($imageUrl) {
        $filename = basename($imageUrl);
        $localPath = __DIR__ . '/uploads/' . $filename;
        if (file_exists($localPath)) {
            $mimeType = mime_content_type($localPath) ?: 'image/jpeg';
            if (str_starts_with($mimeType, 'image/')) {
                $imageData = base64_encode(file_get_contents($localPath));
                $parts[] = [
                    'inlineData' => [
                        'mimeType' => $mimeType,
                        'data'     => $imageData
                    ]
                ];
            }
        }
    }

    $payload = [
        'contents' => [
            ['role' => 'user', 'parts' => $parts]
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

function callOpenAIText(string $prompt, string $language, string $tone, array $platforms, string $apiKey, ?string $imageUrl = null): array {
    if ($language === 'hi') {
        $langInstr = 'Hindi (हिंदी) with Hinglish elements';
    } elseif ($language === 'mix') {
        $langInstr = 'Mix of Hindi and English (natural modern Hinglish, e.g. "Kya aap ready hain?")';
    } else {
        $langInstr = 'English';
    }

    $systemInstruction = "You are an expert social media content creator. Generate content in $langInstr. Tone: $tone. Platforms: " . implode(', ', $platforms) . ". The caption must start with a hook, have a body with emojis, and end with a CTA. Return JSON EXACTLY with: {\"caption\":\"The full caption with hook and CTA included\",\"hashtags\":[...],\"alternatives\":[...],\"bestTimeToPost\":\"...\",\"cta\":\"...\"}";

    $userContent = [
        ['type' => 'text', 'text' => "Create social media content for: \"$prompt\""]
    ];

    if ($imageUrl) {
        $filename = basename($imageUrl);
        $localPath = __DIR__ . '/uploads/' . $filename;
        if (file_exists($localPath)) {
            $mimeType = mime_content_type($localPath) ?: 'image/jpeg';
            if (str_starts_with($mimeType, 'image/')) {
                $imageData = base64_encode(file_get_contents($localPath));
                $userContent[] = [
                    'type' => 'image_url',
                    'image_url' => [
                        'url' => "data:$mimeType;base64,$imageData"
                    ]
                ];
            }
        }
    }

    $payload = [
        'model'       => 'gpt-4o',
        'messages'    => [
            ['role' => 'system', 'content' => $systemInstruction],
            ['role' => 'user', 'content' => $userContent]
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

// ============================================
// MOCK AI GENERATORS
// ============================================

function isHashOrFilename(string $str): bool {
    $str = trim($str);
    $normalized = str_replace([' ', '-', '_'], '', $str);
    if (preg_match('/^[a-f0-9]{32}$/i', $normalized)) return true;
    if (preg_match('/^[a-f0-9]{8}[a-f0-9]{4}[a-f0-9]{4}[a-f0-9]{4}[a-f0-9]{12}$/i', $normalized)) return true;
    if (strlen($normalized) > 12 && preg_match('/^[a-f0-9]+$/i', $normalized)) return true;
    return false;
}

function callMockText(string $prompt, string $language, string $tone, array $platforms): array {
    $topic = trim($prompt);
    if (empty($topic) || isHashOrFilename($topic)) {
        $topic = ($language === 'hi') ? 'हमारे नए अपडेट और स्पेशल फीचर्स' : (($language === 'mix') ? 'hamare new updates aur special features' : 'our latest updates and special features');
    }

    $captions = [
        'en' => [
            'casual' => "Super excited to share this with all of you! 🚀 We've been working on \"$topic\" behind the scenes, and it's finally ready. Let us know what you think in the comments! 👇",
            'professional' => "We are pleased to announce the official release of \"$topic\". Our team has put significant effort into ensuring this meets the highest standards of quality and efficiency. Read more details on our website or get in touch with us today.",
            'funny' => "We said we wouldn't do it, but we did it anyway. 🤷‍♂️ Introducing \"$topic\"! It's here, it's cool, and it's probably going to make your day 10x better. Don't believe us? Try it yourself! 😂",
            'inspirational' => "Every great journey starts with a single step, and \"$topic\" is ours. Believing in your vision and executing with passion is the key to unlocking endless possibilities. Keep pushing forward! ✨",
            'dramatic' => "The moment of truth has arrived. 🎬 After months of silence, \"$topic\" is finally unveiled. This changes everything. Are you ready for what comes next?"
        ],
        'hi' => [
            'casual' => "आप सभी के साथ यह शेयर करने के लिए बेहद उत्सुक हूँ! 🚀 हमने पर्दे के पीछे \"$topic\" पर काम किया है, और यह आखिरकार तैयार है। नीचे कमेंट्स में हमें अपनी राय बताएं! 👇",
            'professional' => "हमें \"$topic\" की आधिकारिक घोषणा करते हुए खुशी हो रही है। हमारी टीम ने यह सुनिश्चित करने के लिए काफी प्रयास किया है कि यह सर्वोत्तम गुणवत्ता मानकों को पूरा करे। अधिक जानकारी के लिए हमसे संपर्क करें।",
            'funny' => "हमने सोचा था नहीं करेंगे, पर दिल है कि मानता नहीं! 🤷‍♂️ पेश है \"$topic\"! यह आपके दिन को शानदार बना देगा। खुद देख लीजिए! 😂",
            'inspirational' => "हर बड़ा सफर एक छोटे कदम से शुरू होता है, और \"$topic\" हमारा पहला कदम है। अपने सपनों पर भरोसा रखें और मेहनत करते रहें। सफलता ज़रूर मिलेगी! ✨",
            'dramatic' => "आखिरकार वह पल आ ही गया जिसका सबको इंतज़ार था। 🎬 महीनों की मेहनत के बाद \"$topic\" आपके सामने है। यह सब कुछ बदल देगा। क्या आप तैयार हैं?"
        ],
        'mix' => [
            'casual' => "Aap sabhi ke saath share karne ke liye super excited hoon! 🚀 Humne backend par \"$topic\" par kaam kiya hai, aur ab ye ready hai. Comment karke bataiye aapko kaisa laga! 👇",
            'professional' => "Hum official level par \"$topic\" ko announce karte hue bohot khush hain. Hamari team ne isme quality aur efficiency ka poora dhayan rakha hai. More details ke liye hamari website visit karein.",
            'funny' => "Humne socha tha ki nahi karenge, par control hi nahi hua! 🤷‍♂️ Introducing \"$topic\"! Ye aapka mood 10x better kar dega. Yaqeen nahi aata toh abhi try karo! 😂",
            'inspirational' => "Har ek bada safar ek single step se hi shuru hota hai, aur \"$topic\" hamara wahi step hai. Apne vision par believe rakho aur hard work karte raho. Success door nahi hai! ✨",
            'dramatic' => "Waqt aa gaya hai sachayi se milne ka. 🎬 Kaafi intezar ke baad, \"$topic\" ab live hai. Ye sab kuch change karne wala hai. Kya aap ready hain?"
        ]
    ];

    $langKey = isset($captions[$language]) ? $language : 'en';
    $toneKey = isset($captions[$langKey][$tone]) ? $tone : 'casual';
    $caption = $captions[$langKey][$toneKey];

    $cleanPromptTag = str_replace(' ', '', ucwords(preg_replace('/[^a-zA-Z0-9\s]/', '', $topic)));
    if (strlen($cleanPromptTag) > 20) {
        $cleanPromptTag = substr($cleanPromptTag, 0, 20);
    }
    
    $hashtags = [];
    if ($language === 'hi') {
        $hashtags = ['#नयाअपडेट', '#सोशलमीडिया', '#बिजनेस', '#' . ($cleanPromptTag ?: 'सोशल')];
    } elseif ($language === 'mix') {
        $hashtags = ['#NewUpdate', '#TrendingNow', '#HinglishVibes', '#' . ($cleanPromptTag ?: 'Update')];
    } else {
        $hashtags = ['#NewRelease', '#Branding', '#SocialMedia', '#' . ($cleanPromptTag ?: 'Brand')];
    }

    $alternatives = [];
    if ($language === 'hi') {
        $alternatives = [
            "💡 \"$topic\" के बारे में क्या राय है? हमें जरूर बताएं!",
            "🔥 एक नया प्रयास: \"$topic\"। इसे आज़माएं और अनुभव साझा करें!"
        ];
    } elseif ($language === 'mix') {
        $alternatives = [
            "💡 \"$topic\" ke baare mein aapka kya kehna hai? Let us know!",
            "🔥 A brand new update: \"$topic\". Abhi try karein!"
        ];
    } else {
        $alternatives = [
            "💡 What are your thoughts on \"$topic\"? Share with us!",
            "🔥 A fresh approach to \"$topic\". Try it out today!"
        ];
    }

    $ctas = [
        'casual' => 'Let us know your thoughts in the comments below!',
        'professional' => 'Contact us today to learn more.',
        'funny' => 'Try it yourself and don\'t forget to share!',
        'inspirational' => 'Keep pushing forward and believe in your dream.',
        'dramatic' => 'Are you ready for the next level?'
    ];
    $cta = $ctas[$toneKey] ?? 'Check it out now!';

    return [
        'caption' => $caption,
        'hashtags' => $hashtags,
        'alternatives' => $alternatives,
        'bestTimeToPost' => '6:00 PM',
        'cta' => $cta
    ];
}

function callMockImage(string $prompt, string $language): array {
    $topic = trim($prompt);
    if (empty($topic) || isHashOrFilename($topic)) {
        $topic = 'Premium Brand Workspace';
    }
    return [
        'imageUrl' => "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop",
        'imagePrompt' => "A professional business workspace showcasing branding elements for $topic"
    ];
}

function callMockVideo(string $prompt, string $language, string $caption): array {
    $topic = trim($prompt);
    if (empty($topic) || isHashOrFilename($topic)) {
        $topic = 'Our Premium Brand';
    }
    return [
        'idea' => "Highlighting $topic in a professional reel",
        'script' => "[Scene 1: Hook] Upbeat music starts, displaying $topic logo.\n[Scene 2: Body] Seamless transition showing high-quality product features.\n[Scene 3: CTA] Text on screen: Visit the link in bio to learn more!",
        'videoPrompt' => "Cinematic high-quality commercial showcasing $topic, modern design and transitions",
        'duration' => '15',
        'musicSuggestion' => 'Upbeat Indie Pop / Chill Lo-fi',
        'scenes' => [
            "Upbeat music starts, displaying $topic logo.",
            "Seamless transition showing high-quality product features.",
            "Text on screen: Visit the link in bio to learn more!"
        ]
    ];
}


