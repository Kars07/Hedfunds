<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
// Database connection parameters
// $servername = "mysql";
// $username = "root";
// $password = "secret";
// $dbname = "cardano_loan_tracker";
$servername = "mysql"; // This should match your service name in docker-compose
$username = "root";
$password = "secret";
$dbname = "cardano_loans";
// $host = $_ENV['DATABASE_HOST'] ?? 'localhost';
// $dbname = $_ENV['DATABASE_NAME'] ?? 'cardano_loans';
// $username = $_ENV['DATABASE_USER'] ?? 'app_user';
// $password = $_ENV['DATABASE_PASSWORD'] ?? 'app_password';

// Create connection
// $conn = new mysqli($servername, $username, $password, $dbname);
try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    // $conn = new mysqli($host, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    // Set charset to utf8
    $conn->set_charset("utf8");
    
} catch (Exception $e) {
    die("Database connection error: " . $e->getMessage());
}
?>