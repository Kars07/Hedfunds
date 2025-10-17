<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'db_connect.php';
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Add a logging function
function logError($message, $data = null) {
    $logFile = 'civil_servants_errors.log';
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[{$timestamp}] {$message}";
    
    if ($data !== null) {
        $logMessage .= " Data: " . json_encode($data);
    }
    
    file_put_contents($logFile, $logMessage . PHP_EOL, FILE_APPEND);
}


// Function to validate email
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Function to sanitize input
function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// API route handling
$action = $_GET['action'] ?? '';

switch ($action) {
    
    case 'submit':
        $data = json_decode(file_get_contents('php://input'), true);
        logError("Received civil servant submission", $data);
        
        // Required fields validation
        $requiredFields = ['walletAddress', 'companyName', 'officialId', 'hrVerificationDocument', 
                          'officialCompanyLetters', 'fullName', 'email'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                $error = "Missing or empty required field: $field";
                logError($error);
                echo json_encode(['status' => 'error', 'message' => $error]);
                exit;
            }
        }
        
        // Validate email
        if (!validateEmail($data['email'])) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid email format']);
            exit;
        }
        
        $conn->begin_transaction();
        try {
            // Get or create user from wallet address
            $userStmt = $conn->prepare("SELECT id FROM users WHERE wallet_address = ?");
            $userStmt->bind_param("s", $data['walletAddress']);
            $userStmt->execute();
            $userResult = $userStmt->get_result();
            
            if ($userResult->num_rows == 0) {
                // Create user if doesn't exist (you might want to modify this based on your user creation logic)
                $createUserStmt = $conn->prepare("INSERT INTO users (wallet_address, payment_key_hash) VALUES (?, ?)");
                // You'll need to provide the payment_key_hash or modify this based on your needs
                $placeholder_pkh = "pkh_" . substr(hash('sha256', $data['walletAddress']), 0, 20);
                $createUserStmt->bind_param("ss", $data['walletAddress'], $placeholder_pkh);
                $createUserStmt->execute();
                $userId = $conn->insert_id;
                logError("Created new user with ID: $userId");
            } else {
                $user = $userResult->fetch_assoc();
                $userId = $user['id'];
            }
            
            // Check if civil servant record already exists for this user
            $checkStmt = $conn->prepare("SELECT id, verification_status FROM civil_servants WHERE user_id = ?");
            $checkStmt->bind_param("i", $userId);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            
            if ($checkResult->num_rows > 0) {
                $existing = $checkResult->fetch_assoc();
                if ($existing['verification_status'] === 'approved') {
                    echo json_encode(['status' => 'error', 'message' => 'You are already verified as a civil servant']);
                    exit;
                } elseif ($existing['verification_status'] === 'pending') {
                    echo json_encode(['status' => 'error', 'message' => 'Your application is already pending verification']);
                    exit;
                }
                // If rejected, allow resubmission by updating the existing record
                $isUpdate = true;
                $civilServantId = $existing['id'];
            } else {
                $isUpdate = false;
            }
            
            // Prepare official company letters as JSON
            $officialLetters = is_array($data['officialCompanyLetters']) 
                ? json_encode($data['officialCompanyLetters']) 
                : $data['officialCompanyLetters'];
            
            if ($isUpdate) {
                // Update existing record
                $updateStmt = $conn->prepare("
                    UPDATE civil_servants 
                    SET company_name = ?, official_id = ?, hr_verification_document = ?, 
                        official_company_letters = ?, full_name = ?, email = ?, 
                        verification_status = 'pending', rejection_reason = NULL,
                        verified_by_admin = NULL, verified_at = NULL, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ");
                $updateStmt->bind_param("ssssssi", 
                    sanitizeInput($data['companyName']),
                    sanitizeInput($data['officialId']),
                    sanitizeInput($data['hrVerificationDocument']),
                    $officialLetters,
                    sanitizeInput($data['fullName']),
                    sanitizeInput($data['email']),
                    $civilServantId
                );
                $updateStmt->execute();
                $message = 'Civil servant information updated and submitted for verification';
            } else {
                // Insert new record
                $insertStmt = $conn->prepare("
                    INSERT INTO civil_servants 
                    (user_id, company_name, official_id, hr_verification_document, 
                     official_company_letters, full_name, email, verification_status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
                ");
                $insertStmt->bind_param("issssss", 
                    $userId,
                    sanitizeInput($data['companyName']),
                    sanitizeInput($data['officialId']),
                    sanitizeInput($data['hrVerificationDocument']),
                    $officialLetters,
                    sanitizeInput($data['fullName']),
                    sanitizeInput($data['email'])
                );
                $insertStmt->execute();
                $message = 'Civil servant information submitted for verification';
            }
            
            $conn->commit();
            logError("Civil servant submission successful");
            echo json_encode(['status' => 'success', 'message' => $message]);
            
        } catch (Exception $e) {
            $conn->rollback();
            $errorMsg = 'Database error: ' . $e->getMessage();
            logError($errorMsg);
            echo json_encode(['status' => 'error', 'message' => $errorMsg]);
        }
        break;
        
    case 'getStatus':
        $data = json_decode(file_get_contents('php://input'), true);
        $walletAddress = $data['walletAddress'] ?? '';
        
        if (empty($walletAddress)) {
            echo json_encode(['status' => 'error', 'message' => 'Missing wallet address']);
            exit;
        }
        
        try {
            // Get civil servant status for this wallet
            $stmt = $conn->prepare("
                SELECT cs.*, u.wallet_address 
                FROM civil_servants cs
                JOIN users u ON cs.user_id = u.id
                WHERE u.wallet_address = ?
            ");
            $stmt->bind_param("s", $walletAddress);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows == 0) {
                echo json_encode(['status' => 'success', 'verified' => false, 'message' => 'No civil servant record found']);
            } else {
                $civilServant = $result->fetch_assoc();
                
                // Decode official company letters if it's JSON
                if (is_string($civilServant['official_company_letters'])) {
                    $decodedLetters = json_decode($civilServant['official_company_letters'], true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $civilServant['official_company_letters'] = $decodedLetters;
                    }
                }
                
                echo json_encode([
                    'status' => 'success',
                    'verified' => $civilServant['verification_status'] === 'approved',
                    'civilServant' => $civilServant
                ]);
            }
        } catch (Exception $e) {
            logError("Error getting civil servant status: " . $e->getMessage());
            echo json_encode(['status' => 'error', 'message' => 'Database error']);
        }
        break;
        
    case 'getAllPending':
        // Admin function to get all pending applications
        try {
            $stmt = $conn->prepare("
                SELECT cs.*, u.wallet_address 
                FROM civil_servants cs
                JOIN users u ON cs.user_id = u.id
                WHERE cs.verification_status = 'pending'
                ORDER BY cs.created_at ASC
            ");
            $stmt->execute();
            $result = $stmt->get_result();
            
            $pendingApplications = [];
            while ($row = $result->fetch_assoc()) {
                // Decode official company letters if it's JSON
                if (is_string($row['official_company_letters'])) {
                    $decodedLetters = json_decode($row['official_company_letters'], true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $row['official_company_letters'] = $decodedLetters;
                    }
                }
                $pendingApplications[] = $row;
            }
            
            echo json_encode(['status' => 'success', 'applications' => $pendingApplications]);
        } catch (Exception $e) {
            logError("Error getting pending applications: " . $e->getMessage());
            echo json_encode(['status' => 'error', 'message' => 'Database error']);
        }
        break;
        
    case 'verify':
        // Admin function to approve/reject applications
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['civilServantId']) || !isset($data['action']) || 
            !in_array($data['action'], ['approve', 'reject'])) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid verification data']);
            exit;
        }
        
        try {
            if ($data['action'] === 'approve') {
                $stmt = $conn->prepare("
                    UPDATE civil_servants 
                    SET verification_status = 'approved', verified_at = CURRENT_TIMESTAMP,
                        rejection_reason = NULL
                    WHERE id = ?
                ");
                $stmt->bind_param("i", $data['civilServantId']);
                $message = 'Civil servant application approved';
            } else {
                $rejectionReason = $data['rejectionReason'] ?? 'No reason provided';
                $stmt = $conn->prepare("
                    UPDATE civil_servants 
                    SET verification_status = 'rejected', rejection_reason = ?
                    WHERE id = ?
                ");
                $stmt->bind_param("si", $rejectionReason, $data['civilServantId']);
                $message = 'Civil servant application rejected';
            }
            
            $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                echo json_encode(['status' => 'success', 'message' => $message]);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Application not found or already processed']);
            }
        } catch (Exception $e) {
            logError("Error verifying civil servant: " . $e->getMessage());
            echo json_encode(['status' => 'error', 'message' => 'Database error']);
        }
        break;
        case 'getStatusByPKH':
        $data = json_decode(file_get_contents('php://input'), true);
        $paymentKeyHash = $data['paymentKeyHash'] ?? '';
        
        if (empty($paymentKeyHash)) {
            echo json_encode(['status' => 'error', 'message' => 'Missing payment key hash']);
            exit;
        }
        
        try {
            // Get civil servant status for this PKH
            $stmt = $conn->prepare("
                SELECT cs.*, u.wallet_address 
                FROM civil_servants cs
                JOIN users u ON cs.user_id = u.id
                WHERE u.payment_key_hash = ?
            ");
            $stmt->bind_param("s", $paymentKeyHash);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows == 0) {
                echo json_encode(['status' => 'success', 'verified' => false, 'message' => 'No civil servant record found']);
            } else {
                $civilServant = $result->fetch_assoc();
                
                // Decode official company letters if it's JSON
                if (is_string($civilServant['official_company_letters'])) {
                    $decodedLetters = json_decode($civilServant['official_company_letters'], true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $civilServant['official_company_letters'] = $decodedLetters;
                    }
                }
                
                echo json_encode([
                    'status' => 'success',
                    'verified' => $civilServant['verification_status'] === 'approved',
                    'civilServant' => $civilServant
                ]);
            }
        } catch (Exception $e) {
            logError("Error getting civil servant status by PKH: " . $e->getMessage());
            echo json_encode(['status' => 'error', 'message' => 'Database error']);
        }
        break;
        
    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
}
?>