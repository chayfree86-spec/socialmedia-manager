<?php
header('Content-Type: text/plain');
error_reporting(E_ALL);
ini_set('display_errors', 1);

define('ALLOW_ACCESS', true);
require_once __DIR__ . '/config/database.php';

try {
    $db = Database::getInstance();
    echo "--- DATABASE COLUMNS ---\n";
    $columns = $db->fetchAll("DESCRIBE users");
    foreach ($columns as $col) {
        echo "Field: {$col['Field']} | Type: {$col['Type']} | Null: {$col['Null']}\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
