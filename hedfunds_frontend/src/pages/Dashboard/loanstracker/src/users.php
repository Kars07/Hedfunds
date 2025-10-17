<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'db_connect.php';
header('Content-Type: application/json');

// Get or create user by wallet address/PKH
function getOrCreateUser($walletAddress, $paymentKeyHash) {
    global $conn;
    
    // Check if user exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE payment_key_hash = ?");
    $stmt->bind_param("s", $paymentKeyHash);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        // Update last login
        $updateStmt = $conn->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?");
        $updateStmt->bind_param("i", $user['id']);
        $updateStmt->execute();
        
        return $user['id'];
    } else {
        // Create new user
        $stmt = $conn->prepare("INSERT INTO users (wallet_address, payment_key_hash) VALUES (?, ?)");
        $stmt->bind_param("ss", $walletAddress, $paymentKeyHash);
        $stmt->execute();
        
        return $conn->insert_id;
    }
}

// API route handling
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        $data = json_decode(file_get_contents('php://input'), true);
        $walletAddress = $data['address'] ?? '';
        $paymentKeyHash = $data['pkh'] ?? '';
        
        if (empty($walletAddress) || empty($paymentKeyHash)) {
            echo json_encode(['status' => 'error', 'message' => 'Missing required parameters']);
            exit;
        }
        
        $userId = getOrCreateUser($walletAddress, $paymentKeyHash);
        echo json_encode(['status' => 'success', 'user_id' => $userId]);
        break;

        
    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
}
?>