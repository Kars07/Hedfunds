<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'db_connect.php';
header('Content-Type: application/json');

// Simple diagnostic tool to check database tables

// Configure which tables to check
$tables = [
    'users',
    'loan_requests',
    'funded_loans',
    'funding_utxos',
    'repaid_loans'
];

$results = [];

foreach ($tables as $table) {
    $query = "SELECT * FROM `$table` LIMIT 100";
    $result = $conn->query($query);
    
    if ($result === false) {
        $results[$table] = [
            'error' => $conn->error,
            'rows' => []
        ];
        continue;
    }
    
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    
    $results[$table] = [
        'count' => count($rows),
        'rows' => $rows
    ];
}

// Output results
echo json_encode([
    'status' => 'success',
    'data' => $results,
    'timestamp' => date('Y-m-d H:i:s')
]);
?>