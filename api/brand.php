<?php
/**
 * Brand Settings API → businesses table
 * 
 * GET    /api/brand.php?business_id=1  → Get brand/business settings
 * POST   /api/brand.php                → Create/Update business
 * PUT    /api/brand.php?business_id=1  → Update business
 */

require_once __DIR__ . '/lib/response.php';
require_once __DIR__ . '/config/database.php';

sendCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$userId        = $_GET['user_id'] ?? null;
$input = getJsonInput();
$explicitBizId = isset($_GET['business_id']) || isset($_POST['business_id']) || isset($_GET['id']) || isset($_POST['id']) || isset($input['business_id']) || isset($input['businessId']) || isset($input['id']);
$businessId    = getBusinessId();

// Resolve numeric user_id: if 'default' or non-numeric, default to 1
$numericUserId = ($userId && is_numeric($userId)) ? intval($userId) : 1;

// Auto-ensure user exists (creates if needed)
ensureUserExists($db, $numericUserId);
ensureDefaultBusinessExists($db, $numericUserId);

// If no explicit business_id, resolve from user_id
if (!$explicitBizId || ($userId && !$explicitBizId)) {
    try {
        $biz = $db->fetchOne("SELECT id FROM businesses WHERE user_id = ? AND is_active = 1 ORDER BY id ASC LIMIT 1", [$numericUserId]);
        $businessId = $biz['id'] ?? 1;
    } catch (Exception $e) {
        $businessId = 1;
    }
}

if ($method === 'GET') {
    try {
        $action = $_GET['action'] ?? null;
        if ($action === 'list') {
            $businesses = $db->fetchAll("SELECT * FROM businesses WHERE user_id = ? AND is_active = 1 ORDER BY id ASC", [$numericUserId]);
            $mapped = array_map('mapToBrand', $businesses);
            jsonSuccess(['businesses' => $mapped]);
        }

        $business = $db->fetchOne("SELECT * FROM businesses WHERE id = ? AND is_active = 1", [$businessId]);

        if (!$business) {
            // No business yet — return empty default, frontend will create on save
            jsonSuccess(['brand' => getDefaultBrand()]);
        }

        $business['logo_settings']    = parseJsonArr($business['logo_settings']);
        $business['display_settings'] = parseJsonArr($business['display_settings']);
        $business['layout_settings']  = parseJsonArr($business['layout_settings']);
        $business['social_links']     = parseJsonArr($business['social_links']);
        $business['ai_config']        = parseJsonArr($business['ai_config']);

        jsonSuccess(['brand' => mapToBrand($business)]);

    } catch (Exception $e) {
        jsonSuccess(['brand' => getDefaultBrand()]);
    }
}

elseif ($method === 'POST' || $method === 'PUT') {
    try {
        $input = getJsonInput();
        if (!$input) jsonError('Invalid JSON input');

        $action = $_GET['action'] ?? $input['action'] ?? null;
        $isCreate = ($action === 'create' || $businessId <= 0);

        $existing = null;
        if (!$isCreate) {
            $existing = $db->fetchOne("SELECT id FROM businesses WHERE id = ? AND is_active = 1", [$businessId]);
        }

        $logoS    = buildLogoSettings($input);
        $displayS = buildDisplaySettings($input);
        $layoutS  = buildLayoutSettings($input);
        $socialL  = buildSocialLinks($input);
        $aiC      = buildAiConfig($input);

        $bn = $input['brandName'] ?? $input['brand_name'] ?? 'My Brand';
        $bc = $input['brandColor'] ?? $input['brand_color'] ?? '#4f46e5';
        $ph = $input['phone'] ?? null;
        $em = $input['email'] ?? null;
        $ad = $input['address'] ?? null;

        if ($existing) {
            $db->execute(
                "UPDATE businesses SET brand_name=?, brand_color=?, phone=?, email=?, address=?,
                 logo_settings=?, display_settings=?, layout_settings=?, social_links=?, ai_config=?
                 WHERE id=?",
                [$bn, $bc, $ph, $em, $ad, json_encode($logoS), json_encode($displayS),
                 json_encode($layoutS), json_encode($socialL), json_encode($aiC), $businessId]
            );
            $msg = '✅ Brand settings updated!';
        } else {
            $uid = $numericUserId;
            $businessId = $db->insert(
                "INSERT INTO businesses (user_id,brand_name,brand_color,phone,email,address,
                 logo_settings,display_settings,layout_settings,social_links,ai_config)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                [$uid,$bn,$bc,$ph,$em,$ad,json_encode($logoS),json_encode($displayS),
                 json_encode($layoutS),json_encode($socialL),json_encode($aiC)]
            );
            $msg = '✅ Brand settings created!';
        }

        $updated = $db->fetchOne("SELECT * FROM businesses WHERE id = ?", [$businessId]);
        jsonSuccess(['message' => $msg, 'brand' => mapToBrand($updated)]);

    } catch (Exception $e) {
        jsonError('Save failed: ' . $e->getMessage(), 500);
    }
}

elseif ($method === 'DELETE') {
    try {
        if ($businessId <= 0) {
            jsonError('business_id is required for deletion');
        }

        $count = $db->fetchOne("SELECT COUNT(*) as cnt FROM businesses WHERE user_id = ? AND is_active = 1", [$numericUserId]);
        if ($count['cnt'] <= 1) {
            jsonError('You must have at least one active business profile!');
        }

        $db->execute("UPDATE businesses SET is_active = 0 WHERE id = ?", [$businessId]);
        jsonSuccess(['message' => '🏢 Business deleted successfully!']);
    } catch (Exception $e) {
        jsonError('Delete failed: ' . $e->getMessage(), 500);
    }
}

// ============ HELPERS ============

function ensureUserExists($db, int $userId): void {
    $user = $db->fetchOne("SELECT id FROM users WHERE id = ?", [$userId]);
    if (!$user) {
        // Auto-create user with default credentials
        $db->execute(
            "INSERT INTO users (id, email, password_hash, name, is_active) VALUES (?, ?, ?, ?, 1)",
            [$userId, "user{$userId}@socialmm.com", password_hash('changeme123', PASSWORD_BCRYPT), "User {$userId}"]
        );
    }
}

function ensureDefaultBusinessExists($db, int $userId): void {
    $biz = $db->fetchOne("SELECT id FROM businesses WHERE user_id = ? AND is_active = 1 LIMIT 1", [$userId]);
    if (!$biz) {
        $logoS    = ['color'=>'','white'=>'','black'=>'','size'=>60];
        $displayS = ['showLogo'=>true,'showName'=>true,'showContact'=>true,'showSocials'=>true,'overlayOpacity'=>90];
        $layoutS  = ['selectedLayout'=>'classic','logoPosition'=>'top-right','namePosition'=>'bottom-left','addressPosition'=>'bottom-left','socialPosition'=>'bottom-right'];
        $socialL  = [
            'instagram'=>['active'=>true,'url'=>''],
            'facebook'=>['active'=>true,'url'=>''],
            'linkedin'=>['active'=>true,'url'=>''],
            'whatsapp'=>['active'=>true,'url'=>''],
            'pinterest'=>['active'=>false,'url'=>''],
            'youtube'=>['active'=>false,'url'=>''],
            'google_business'=>['active'=>false,'url'=>'']
        ];
        $aiC      = ['textModel'=>'gemini-1.5-flash','imageModel'=>'imagen','geminiApiKey'=>'','openaiApiKey'=>''];
        
        $db->insert(
            "INSERT INTO businesses (user_id,brand_name,brand_color,phone,email,address,
             logo_settings,display_settings,layout_settings,social_links,ai_config)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            [$userId,'My Brand','#4f46e5','','','',json_encode($logoS),json_encode($displayS),
             json_encode($layoutS),json_encode($socialL),json_encode($aiC)]
        );
    }
}

function parseJsonArr($v): array {
    if (is_string($v)) { $d = json_decode($v, true); return is_array($d) ? $d : []; }
    return is_array($v) ? $v : [];
}

function mapToBrand($r): array {
    $logo = parseJsonArr($r['logo_settings'] ?? '{}');
    $disp = parseJsonArr($r['display_settings'] ?? '{}');
    $lay  = parseJsonArr($r['layout_settings'] ?? '{}');
    $soc  = parseJsonArr($r['social_links'] ?? '{}');
    $ai   = parseJsonArr($r['ai_config'] ?? '{}');

    $activeSocials = [];
    foreach (['instagram','facebook','linkedin','whatsapp','pinterest','youtube','google_business'] as $p) {
        $activeSocials[$p] = (bool)($soc[$p]['active'] ?? false);
    }
    if (empty(array_filter($activeSocials))) {
        $activeSocials = ['instagram'=>true,'facebook'=>true,'linkedin'=>true,'whatsapp'=>true,'pinterest'=>false,'youtube'=>false,'google_business'=>false];
    }

    return [
        'id'=>$r['id'],'business_id'=>$r['id'],'user_id'=>$r['user_id']??1,
        'brandName'=>$r['brand_name']??'My Brand','brand_name'=>$r['brand_name']??'My Brand',
        'brandColor'=>$r['brand_color']??'#4f46e5','brand_color'=>$r['brand_color']??'#4f46e5',
        'logoColor'=>$logo['color']??'','logoWhite'=>$logo['white']??'','logoBlack'=>$logo['black']??'',
        'logoSize'=>$logo['size']??60,'phone'=>$r['phone']??'','email'=>$r['email']??'',
        'address'=>$r['address']??'','showLogo'=>$disp['showLogo']??true,
        'showName'=>$disp['showName']??true,'showContact'=>$disp['showContact']??true,
        'showSocials'=>$disp['showSocials']??true,'watermarkEnabled'=>$disp['watermarkEnabled']??true,'overlayOpacity'=>$disp['overlayOpacity']??90,
        'selectedLayout'=>$lay['selectedLayout']??'classic','logoPosition'=>$lay['logoPosition']??'top-right',
        'namePosition'=>$lay['namePosition']??'bottom-left','addressPosition'=>$lay['addressPosition']??'bottom-left',
        'socialPosition'=>$lay['socialPosition']??'bottom-right','activeSocials'=>$activeSocials,
        'textModel'=>$ai['textModel']??'gemini-1.5-flash','imageModel'=>$ai['imageModel']??'imagen',
        'geminiApiKey'=>$ai['geminiApiKey']??'','openaiApiKey'=>$ai['openaiApiKey']??'',
        'is_active'=>(bool)($r['is_active']??true),'created_at'=>$r['created_at']??null,'updated_at'=>$r['updated_at']??null,
    ];
}

function getDefaultBrand(): array {
    return [
        'id'=>null,'business_id'=>null,'brandName'=>'My Brand','brand_name'=>'My Brand',
        'brandColor'=>'#4f46e5','brand_color'=>'#4f46e5','logoColor'=>'','logoWhite'=>'','logoBlack'=>'','logoSize'=>60,
        'phone'=>'','email'=>'','address'=>'','showLogo'=>true,'showName'=>true,'showContact'=>true,'showSocials'=>true,'watermarkEnabled'=>true,
        'overlayOpacity'=>90,'selectedLayout'=>'classic','logoPosition'=>'top-right','namePosition'=>'bottom-left',
        'addressPosition'=>'bottom-left','socialPosition'=>'bottom-right',
        'activeSocials'=>['instagram'=>true,'facebook'=>true,'linkedin'=>true,'whatsapp'=>true,'pinterest'=>false,'youtube'=>false,'google_business'=>false],
        'textModel'=>'gemini-1.5-flash','imageModel'=>'imagen','geminiApiKey'=>'','openaiApiKey'=>''
    ];
}

function buildLogoSettings($in): array { return ['color'=>$in['logoColor']??$in['logo_color']??'','white'=>$in['logoWhite']??$in['logo_white']??'','black'=>$in['logoBlack']??$in['logo_black']??'','size'=>intval($in['logoSize']??$in['logo_size']??60)]; }
function buildDisplaySettings($in): array { return ['showLogo'=>(bool)($in['showLogo']??$in['show_logo']??true),'showName'=>(bool)($in['showName']??$in['show_name']??true),'showContact'=>(bool)($in['showContact']??$in['show_contact']??true),'showSocials'=>(bool)($in['showSocials']??$in['show_socials']??true),'watermarkEnabled'=>(bool)($in['watermarkEnabled']??$in['watermark_enabled']??true),'overlayOpacity'=>intval($in['overlayOpacity']??$in['overlay_opacity']??90)]; }
function buildLayoutSettings($in): array { return ['selectedLayout'=>$in['selectedLayout']??$in['selected_layout']??'classic','logoPosition'=>$in['logoPosition']??$in['logo_position']??'top-right','namePosition'=>$in['namePosition']??$in['name_position']??'bottom-left','addressPosition'=>$in['addressPosition']??$in['address_position']??'bottom-left','socialPosition'=>$in['socialPosition']??$in['social_position']??'bottom-right']; }
function buildSocialLinks($in): array { $as=$in['activeSocials']??$in['active_socials']??[]; if(!is_array($as))$as=[]; $links=[]; foreach(['instagram','facebook','linkedin','whatsapp','pinterest','youtube','google_business'] as $p){ $links[$p]=['active'=>(bool)($as[$p]??false),'url'=>$in['social_'.$p]??'']; } if(empty(array_filter(array_column($links,'active')))){ foreach(['instagram','facebook','linkedin','whatsapp'] as $p)$links[$p]['active']=true; } return $links; }
function buildAiConfig($in): array { return ['textModel'=>$in['textModel']??$in['text_model']??'gemini-1.5-flash','imageModel'=>$in['imageModel']??$in['image_model']??'imagen','geminiApiKey'=>$in['geminiApiKey']??$in['gemini_api_key']??'','openaiApiKey'=>$in['openaiApiKey']??$in['openai_api_key']??'']; }
