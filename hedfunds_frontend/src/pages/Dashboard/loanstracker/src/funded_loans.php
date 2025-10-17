<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'db_connect.php';
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Add a logging function
function logError($message, $data = null) {
    $logFile = 'loan_errors.log';
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[{$timestamp}] {$message}";
    
    if ($data !== null) {
        $logMessage .= " Data: " . json_encode($data);
    }
    
    file_put_contents($logFile, $logMessage . PHP_EOL, FILE_APPEND);
}
// Function to calculate credit score based on payment history and timing
function calculateCreditScore($totalLoans, $onTimePayments, $earlyPayments, $latePayments, $paymentDetails = []) {
    $baseScore = 500;
    if ($totalLoans == 0) return $baseScore;
    
    $score = $baseScore;
    
    // Experience bonus (up to +50 points for having more loans)
    if ($totalLoans >= 10) {
        $score += 50;
    } elseif ($totalLoans >= 5) {
        $score += 25;
    } elseif ($totalLoans >= 2) {
        $score += 10;
    }
    
    // If we have detailed payment data, use dynamic scoring
    if (!empty($paymentDetails)) {
        $score += calculateDynamicScore($paymentDetails);
    } else {
        // Fallback to old percentage-based calculation
        $onTimePercentage = ($onTimePayments / $totalLoans) * 100;
        $earlyPercentage = ($earlyPayments / $totalLoans) * 100;
        $latePercentage = ($latePayments / $totalLoans) * 100;
        
        $score += ($onTimePercentage * 2);
        $score += ($earlyPercentage * 1);
        $score -= ($latePercentage * 3);
    }
    
    // Ensure score is within reasonable bounds
    $score = max(300, min(850, $score));
    return round($score);
}
// Function to calculate dynamic score based on detailed payment timing
function calculateDynamicScore($paymentDetails) {
    $totalScore = 0;
    
    foreach ($paymentDetails as $payment) {
        $category = $payment['category'];
        $daysEarlyLate = $payment['days'];
        $loanDuration = $payment['loan_duration'] ?? 30; // Default 30 days if not provided
        
        switch ($category) {
            case 'early':
                $totalScore += calculateEarlyScore($daysEarlyLate, $loanDuration);
                break;
                
            case 'on_time':
                $totalScore += calculateOnTimeScore($daysEarlyLate, $loanDuration);
                break;
                
            case 'late':
                $totalScore += calculateLateScore($daysEarlyLate);
                break;
        }
    }
    
    return $totalScore;
}
// Function to calculate early payment score
function calculateEarlyScore($daysEarly, $loanDuration) {
    $earlyThreshold25 = $loanDuration * 0.25; // First 25% of loan duration
    $earlyThreshold50 = $loanDuration * 0.50; // First 50% of loan duration
    
    if ($daysEarly >= $earlyThreshold25) {
        // Very early - within first 25% of loan duration
        return 100;
    } elseif ($daysEarly >= $earlyThreshold50) {
        // Early - within first 50% of loan duration
        return 75;
    } else {
        // Less early but still early
        return 50;
    }
}

// Function to calculate on-time payment score
function calculateOnTimeScore($daysBeforeDeadline, $loanDuration) {
    $onTimeThreshold75 = $loanDuration * 0.75; // First 75% of loan duration
    
    if ($daysBeforeDeadline >= $onTimeThreshold75) {
        // On-time - within first 75% of loan duration
        return 50;
    } elseif ($daysBeforeDeadline > 5) {
        // More than 5 days before deadline
        return 35;
    } elseif ($daysBeforeDeadline >= 1 && $daysBeforeDeadline <= 5) {
        // 1-5 days before deadline
        return 15;
    } else {
        // On deadline day (same day)
        return 0;
    }
}

// Function to calculate late payment score (negative points)
function calculateLateScore($daysLate) {
    if ($daysLate == 1) {
        // 1 day late
        return -5;
    } elseif ($daysLate >= 2 && $daysLate <= 5) {
        // 2-5 days late
        return -30;
    } else {
        // More than 5 days late
        return -50;
    }
}

// function to update credit score with detailed payment tracking
function updateCreditScore($conn, $userId, $paymentCategory, $daysEarlyLate, $loanDuration = 30) {
    try {
        // Get current credit score data
        $stmt = $conn->prepare("SELECT * FROM credit_scores WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();       
        
        if ($result->num_rows == 0) {
            // Create initial credit score record
            $insertStmt = $conn->prepare("INSERT INTO credit_scores (user_id) VALUES (?)");
            $insertStmt->bind_param("i", $userId);
            $insertStmt->execute();
            // Get the newly created record
            $stmt->execute();
            $result = $stmt->get_result();
        }
        
        $creditData = $result->fetch_assoc();   
        
        // Update counters based on payment category
        $newTotalLoans = $creditData['total_loans'] + 1;
        $newOnTimePayments = $creditData['on_time_payments'];
        $newEarlyPayments = $creditData['early_payments'];
        $newLatePayments = $creditData['late_payments'];
        
        switch ($paymentCategory) {
            case 'early':
                $newEarlyPayments++;
                break;
            case 'on_time':
                $newOnTimePayments++;
                break;
            case 'late':
                $newLatePayments++;
                break;
        }
        
        // Get all payment details for this user for dynamic scoring
        $paymentDetails = getPaymentDetailsForUser($conn, $userId);
        
        // Add current payment to details
        $paymentDetails[] = [
            'category' => $paymentCategory,
            'days' => $daysEarlyLate,
            'loan_duration' => $loanDuration
        ];
        
        // Calculate new credit score with dynamic scoring
        $newScore = calculateCreditScore($newTotalLoans, $newOnTimePayments, $newEarlyPayments, $newLatePayments, $paymentDetails);
        
        // Update credit score record
        $updateStmt = $conn->prepare("
            UPDATE credit_scores 
            SET current_score = ?, 
                total_loans = ?, 
                on_time_payments = ?, 
                early_payments = ?, 
                late_payments = ?
            WHERE user_id = ?
        ");
        $updateStmt->bind_param("iiiiii", 
            $newScore, 
            $newTotalLoans, 
            $newOnTimePayments, 
            $newEarlyPayments, 
            $newLatePayments, 
            $userId
        );
        $updateStmt->execute();
        
        logError("Credit score updated for user $userId: $newScore");
        return $newScore;
        
    } catch (Exception $e) {
        logError("Error updating credit score: " . $e->getMessage());
        return null;
    }
}

// function to determine payment category with more detailed timing
function determinePaymentCategory($deadline, $repaidAt, $loanStartTime = null) {
    $deadlineTime = intval($deadline);
    $repaymentTime = intval($repaidAt);   
    $daysDifference = ($repaymentTime - $deadlineTime) / (24 * 60 * 60 * 1000); // Convert to days
    
    // Calculate loan duration if start time is provided
    $loanDuration = 30; // Default 30 days
    if ($loanStartTime) {
        $loanDuration = ($deadlineTime - intval($loanStartTime)) / (24 * 60 * 60 * 1000);
    }
    
    if ($daysDifference <= -1) {
        return [
            'category' => 'early', 
            'days' => abs($daysDifference),
            'loan_duration' => $loanDuration
        ];
    } elseif ($daysDifference >= 1) {
        return [
            'category' => 'late', 
            'days' => $daysDifference,
            'loan_duration' => $loanDuration
        ];
    } else {
        return [
            'category' => 'on_time', 
            'days' => abs($daysDifference),
            'loan_duration' => $loanDuration
        ];
    }
}
// Helper function to get detailed payment history for a user
function getPaymentDetailsForUser($conn, $userId) {
    try {
        $stmt = $conn->prepare("
            SELECT 
                rl.days_early_late,
                rl.payment_category,
                DATEDIFF(FROM_UNIXTIME(lr.deadline/1000), FROM_UNIXTIME(fl.funded_at/1000)) as loan_duration_days
            FROM repaid_loans rl
            JOIN funded_loans fl ON rl.funded_loan_id = fl.id
            JOIN loan_requests lr ON fl.loan_request_id = lr.id
            WHERE lr.borrower_id = ?
            ORDER BY rl.repaid_at DESC
        ");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $paymentDetails = [];
        while ($row = $result->fetch_assoc()) {
            $paymentDetails[] = [
                'category' => $row['payment_category'],
                'days' => floatval($row['days_early_late']),
                'loan_duration' => max(1, intval($row['loan_duration_days'])) // Ensure minimum 1 day
            ];
        }
        
        return $paymentDetails;
        
    } catch (Exception $e) {
        logError("Error getting payment details: " . $e->getMessage());
        return [];
    }
}
// API route handling
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'getAllFundedLoanIds':
        // Get all original loan IDs that have been funded
        try {
            $query = "
                SELECT 
                    lr.loan_id
                FROM 
                    funded_loans fl
                    JOIN loan_requests lr ON fl.loan_request_id = lr.id
                GROUP BY 
                    lr.loan_id
            ";
            
            $result = $conn->query($query);
            
            if (!$result) {
                throw new Exception("Database error: " . $conn->error);
            }
            
            $loanIds = [];
            while ($row = $result->fetch_assoc()) {
                $loanIds[] = $row['loan_id'];
            }
            
            echo json_encode(['status' => 'success', 'loanIds' => $loanIds]);
        } catch (Exception $e) {
            logError("Error fetching all funded loan IDs: " . $e->getMessage());
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;
        
    case 'getOriginalLoanId':
        // Get the original loan ID for a specific funded loan ID
        $data = json_decode(file_get_contents('php://input'), true);
        $fundedLoanId = $data['fundedLoanId'] ?? '';
        
        if (empty($fundedLoanId)) {
            echo json_encode(['status' => 'error', 'message' => 'Missing funded loan ID']);
            exit;
        }
        
        try {
            $query = "
                SELECT 
                    lr.loan_id as originalLoanId
                FROM 
                    funded_loans fl
                    JOIN loan_requests lr ON fl.loan_request_id = lr.id
                WHERE 
                    fl.funded_loan_id = ?
            ";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param("s", $fundedLoanId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                echo json_encode(['status' => 'success', 'originalLoanId' => $row['originalLoanId']]);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Funded loan not found']);
            }
        } catch (Exception $e) {
            logError("Error getting original loan ID: " . $e->getMessage());
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'getBorrowerLoans':
        $data = json_decode(file_get_contents('php://input'), true);
        $borrowerPkh = $data['borrowerPKH'] ?? '';
        
        if (empty($borrowerPkh)) {
            echo json_encode(['status' => 'error', 'message' => 'Missing borrower PKH']);
            exit;
        }
        
        // Get user ID from PKH
        $stmt = $conn->prepare("SELECT id FROM users WHERE payment_key_hash = ?");
        $stmt->bind_param("s", $borrowerPkh);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows == 0) {
            echo json_encode(['status' => 'error', 'message' => 'User not found']);
            exit;
        }
        
        $user = $result->fetch_assoc();
        $borrowerId = $user['id'];
        
        // Get loans for this borrower
        $query = "
            SELECT 
                fl.funded_loan_id,
                fl.funded_at,
                fl.tx_hash,
                fl.is_active,
                lr.loan_id,
                lr.loan_amount,
                lr.interest,
                lr.deadline,
                borrower.payment_key_hash as borrower_pkh,
                lender.payment_key_hash as lender_pkh,
                rl.repaid_at,
                rl.repayment_tx_hash
            FROM 
                loan_requests lr
                JOIN funded_loans fl ON lr.id = fl.loan_request_id
                JOIN users borrower ON lr.borrower_id = borrower.id
                JOIN users lender ON fl.lender_id = lender.id
                LEFT JOIN repaid_loans rl ON fl.id = rl.funded_loan_id
            WHERE 
                lr.borrower_id = ? AND fl.is_active = 1
            ORDER BY 
                fl.funded_at DESC
        ";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $borrowerId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $loans = [];
        while ($row = $result->fetch_assoc()) {
            $loan = [
                'loanId' => $row['loan_id'],
                'fundedLoanId' => $row['funded_loan_id'],
                'fundedAt' => (int)$row['funded_at'],
                'lenderPKH' => $row['lender_pkh'],
                'borrowerPKH' => $row['borrower_pkh'],
                'loanAmount' => $row['loan_amount'],
                'interest' => $row['interest'],
                'deadline' => $row['deadline'],
                'txHash' => $row['tx_hash'],
                'isActive' => (bool)$row['is_active']
            ];
            
            // Add repayment info if available
            if ($row['repaid_at']) {
                $loan['repaymentInfo'] = [
                    'repaidAt' => (int)$row['repaid_at'],
                    'repaymentTxHash' => $row['repayment_tx_hash']
                ];
            }
            
            $loans[] = $loan;
        }
        
        echo json_encode(['status' => 'success', 'loans' => $loans]);
        break;

case 'getBorrowerRepaidLoans':
    $data = json_decode(file_get_contents('php://input'), true);
    $borrowerPkh = $data['borrowerPKH'] ?? '';
    
    if (empty($borrowerPkh)) {
        echo json_encode(['status' => 'error', 'message' => 'Missing borrower PKH']);
        exit;
    }
    
    // Get user ID from PKH
    $stmt = $conn->prepare("SELECT id FROM users WHERE payment_key_hash = ?");
    $stmt->bind_param("s", $borrowerPkh);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows == 0) {
        echo json_encode(['status' => 'error', 'message' => 'User not found']);
        exit;
    }
    
    $user = $result->fetch_assoc();
    $borrowerId = $user['id'];
    
    // Get repaid loans for this borrower with payment timing information
    $query = "
        SELECT 
            fl.funded_loan_id,
            lr.loan_id as original_loan_id,
            lr.loan_amount,
            lr.interest,
            lr.deadline,
            fl.funded_at,
            borrower.payment_key_hash as borrower_pkh,
            lender.payment_key_hash as lender_pkh,
            rl.repaid_at,
            rl.repayment_tx_hash,
            rl.days_early_late,
            rl.payment_category
        FROM 
            loan_requests lr
            JOIN funded_loans fl ON lr.id = fl.loan_request_id
            JOIN users borrower ON lr.borrower_id = borrower.id
            JOIN users lender ON fl.lender_id = lender.id
            JOIN repaid_loans rl ON fl.id = rl.funded_loan_id
        WHERE 
            lr.borrower_id = ?
        ORDER BY 
            rl.repaid_at DESC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $borrowerId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $repaidLoans = [];
    while ($row = $result->fetch_assoc()) {
        $repaidLoans[] = [
            'id' => $row['funded_loan_id'],
            'data' => [
                'repaidAt' => (int)$row['repaid_at'],
                'repaymentTxHash' => $row['repayment_tx_hash'],
                'loanAmount' => $row['loan_amount'],
                'interest' => $row['interest'],
                'originalLoanId' => $row['original_loan_id'],
                'lenderPKH' => $row['lender_pkh'],
                'borrowerPKH' => $row['borrower_pkh'],
                'deadline' => $row['deadline'],
                'fundedAt' => (int)$row['funded_at'],
                'paymentCategory' => $row['payment_category'],
                'daysEarlyLate' => floatval($row['days_early_late'])
            ]
        ];
    }
    
    echo json_encode(['status' => 'success', 'repaidLoans' => $repaidLoans]);
    break;
    // Add this case to your existing users.php switch statement

case 'getWalletFromPKH':
    $data = json_decode(file_get_contents('php://input'), true);
    $pkh = $data['pkh'] ?? '';
    
    if (empty($pkh)) {
        echo json_encode(['status' => 'error', 'message' => 'Missing PKH']);
        exit;
    }
    
    try {
        $stmt = $conn->prepare("SELECT wallet_address FROM users WHERE payment_key_hash = ?");
        $stmt->bind_param("s", $pkh);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            echo json_encode([
                'status' => 'success', 
                'walletAddress' => $user['wallet_address']
            ]);
        } else {
            echo json_encode([
                'status' => 'error', 
                'message' => 'User not found'
            ]);
        }
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error', 
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
    break;
    case 'getByPKH':
    $data = json_decode(file_get_contents('php://input'), true);
    $paymentKeyHash = $data['pkh'] ?? '';
    
    if (empty($paymentKeyHash)) {
        echo json_encode(['status' => 'error', 'message' => 'Missing PKH parameter']);
        exit;
    }
    
    try {
        $stmt = $conn->prepare("SELECT wallet_address FROM users WHERE payment_key_hash = ?");
        $stmt->bind_param("s", $paymentKeyHash);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            echo json_encode(['status' => 'success', 'walletAddress' => $user['wallet_address']]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'User not found']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
    }
    break;
        
    case 'get':
        $data = json_decode(file_get_contents('php://input'), true);
        $lenderPkh = $data['lenderPKH'] ?? '';
        
        if (empty($lenderPkh)) {
            echo json_encode(['status' => 'error', 'message' => 'Missing lender PKH']);
            exit;
        }
        
        // Get user ID from PKH
        $stmt = $conn->prepare("SELECT id FROM users WHERE payment_key_hash = ?");
        $stmt->bind_param("s", $lenderPkh);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows == 0) {
            echo json_encode(['status' => 'error', 'message' => 'User not found']);
            exit;
        }
        
        $user = $result->fetch_assoc();
        $lenderId = $user['id'];
        
        // Get funded loans for this lender
        $query = "
            SELECT 
                fl.funded_loan_id,
                fl.funded_at,
                fl.tx_hash,
                fl.is_active,
                lr.loan_id,
                lr.loan_amount,
                lr.interest,
                lr.deadline,
                borrower.payment_key_hash as borrower_pkh,
                lender.payment_key_hash as lender_pkh,
                rl.repaid_at,
                rl.repayment_tx_hash
            FROM 
                funded_loans fl
                JOIN loan_requests lr ON fl.loan_request_id = lr.id
                JOIN users borrower ON lr.borrower_id = borrower.id
                JOIN users lender ON fl.lender_id = lender.id
                LEFT JOIN repaid_loans rl ON fl.id = rl.funded_loan_id
            WHERE 
                fl.lender_id = ?
            ORDER BY 
                fl.funded_at DESC
        ";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $lenderId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $loans = [];
        while ($row = $result->fetch_assoc()) {
            // Get funding UTXOs for this loan
            $utxoStmt = $conn->prepare("
                SELECT tx_hash, output_index 
                FROM funding_utxos 
                WHERE funded_loan_id = (SELECT id FROM funded_loans WHERE funded_loan_id = ?)
            ");
            $utxoStmt->bind_param("s", $row['funded_loan_id']);
            $utxoStmt->execute();
            $utxoResult = $utxoStmt->get_result();
            
            $fundedWith = [];
            while ($utxo = $utxoResult->fetch_assoc()) {
                $fundedWith[] = [
                    'txHash' => $utxo['tx_hash'],
                    'outputIndex' => (int)$utxo['output_index']
                ];
            }
            
            $loan = [
                'loanId' => $row['loan_id'],
                'fundedLoanId' => $row['funded_loan_id'],
                'fundedAt' => (int)$row['funded_at'],
                'lenderPKH' => $row['lender_pkh'],
                'borrowerPKH' => $row['borrower_pkh'],
                'loanAmount' => $row['loan_amount'],
                'interest' => $row['interest'],
                'deadline' => $row['deadline'],
                'txHash' => $row['tx_hash'],
                'fundedWith' => $fundedWith,
                'isActive' => (bool)$row['is_active']
            ];
            
            // Add repayment info if available
            if ($row['repaid_at']) {
                $loan['repaymentInfo'] = [
                    'repaidAt' => (int)$row['repaid_at'],
                    'repaymentTxHash' => $row['repayment_tx_hash']
                ];
            }
            
            $loans[] = $loan;
        }
        
        echo json_encode(['status' => 'success', 'loans' => $loans]);
        break;
        
    case 'add':
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Log the incoming data for debugging
        logError("Received add request", $data);
        
        // Required fields validation
        $requiredFields = ['loanId', 'fundedLoanId', 'lenderPKH', 'borrowerPKH', 'loanAmount', 
                          'interest', 'deadline', 'txHash', 'fundedWith', 'fundedAt'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                $error = "Missing required field: $field";
                logError($error);
                echo json_encode(['status' => 'error', 'message' => $error]);
                exit;
            }
        }
        
        // Start transaction
        $conn->begin_transaction();
        
        try {
            // Get or create lender
            $lenderStmt = $conn->prepare("SELECT id FROM users WHERE payment_key_hash = ?");
            $lenderStmt->bind_param("s", $data['lenderPKH']);
            $lenderStmt->execute();
            $lenderResult = $lenderStmt->get_result();
            
            if ($lenderResult->num_rows == 0) {
                // Create lender user if not exists
                $insertLenderStmt = $conn->prepare("INSERT INTO users (wallet_address, payment_key_hash) VALUES (?, ?)");
                // Use a placeholder for wallet_address since it's not provided in this context
                $placeholder = "wallet_" . substr($data['lenderPKH'], 0, 10); 
                $insertLenderStmt->bind_param("ss", $placeholder, $data['lenderPKH']);
                $insertLenderStmt->execute();
                $lenderId = $conn->insert_id;
                logError("Created new lender with ID: $lenderId");
            } else {
                $lender = $lenderResult->fetch_assoc();
                $lenderId = $lender['id'];
                logError("Found existing lender with ID: $lenderId");
            }
            
            // Get or create borrower
            $borrowerStmt = $conn->prepare("SELECT id FROM users WHERE payment_key_hash = ?");
            $borrowerStmt->bind_param("s", $data['borrowerPKH']);
            $borrowerStmt->execute();
            $borrowerResult = $borrowerStmt->get_result();
            
            if ($borrowerResult->num_rows == 0) {
                // Create borrower user if not exists
                $insertBorrowerStmt = $conn->prepare("INSERT INTO users (wallet_address, payment_key_hash) VALUES (?, ?)");
                $placeholder = "wallet_" . substr($data['borrowerPKH'], 0, 10);
                $insertBorrowerStmt->bind_param("ss", $placeholder, $data['borrowerPKH']);
                $insertBorrowerStmt->execute();
                $borrowerId = $conn->insert_id;
                logError("Created new borrower with ID: $borrowerId");
            } else {
                $borrower = $borrowerResult->fetch_assoc();
                $borrowerId = $borrower['id'];
                logError("Found existing borrower with ID: $borrowerId");
            }
            
            // Check if loan request exists, create if not
            $loanRequestStmt = $conn->prepare("SELECT id FROM loan_requests WHERE loan_id = ?");
            $loanRequestStmt->bind_param("s", $data['loanId']);
            $loanRequestStmt->execute();
            $loanRequestResult = $loanRequestStmt->get_result();
            
            if ($loanRequestResult->num_rows == 0) {
                // Create loan request
                $insertLoanStmt = $conn->prepare("
                    INSERT INTO loan_requests 
                    (loan_id, borrower_id, loan_amount, interest, deadline, status) 
                    VALUES (?, ?, ?, ?, ?, 'funded')
                ");
                $insertLoanStmt->bind_param("siiis", 
                    $data['loanId'], 
                    $borrowerId, 
                    $data['loanAmount'], 
                    $data['interest'], 
                    $data['deadline']
                );
                $insertLoanStmt->execute();
                $loanRequestId = $conn->insert_id;
                logError("Created new loan request with ID: $loanRequestId");
            } else {
                $loanRequest = $loanRequestResult->fetch_assoc();
                $loanRequestId = $loanRequest['id'];
                
                // Update loan request status
                $updateStatusStmt = $conn->prepare("UPDATE loan_requests SET status = 'funded' WHERE id = ?");
                $updateStatusStmt->bind_param("i", $loanRequestId);
                $updateStatusStmt->execute();
                logError("Updated existing loan request with ID: $loanRequestId");
            }
            
            // Check if this funded loan already exists to avoid duplicates
            $checkFundedLoanStmt = $conn->prepare("
                SELECT id FROM funded_loans WHERE funded_loan_id = ?
            ");
            $checkFundedLoanStmt->bind_param("s", $data['fundedLoanId']);
            $checkFundedLoanStmt->execute();
            $checkFundedLoanResult = $checkFundedLoanStmt->get_result();
            
            if ($checkFundedLoanResult->num_rows > 0) {
                // Already exists, don't create duplicate
                $fundedLoan = $checkFundedLoanResult->fetch_assoc();
                $fundedLoanId = $fundedLoan['id'];
                logError("Funded loan already exists with ID: $fundedLoanId");
                
                // Still commit transaction as we may have updated loan request status
                $conn->commit();
                echo json_encode(['status' => 'success', 'message' => 'Funded loan already recorded']);
                exit;
            }
            
            // Insert funded loan
            $insertFundedLoanStmt = $conn->prepare("
                INSERT INTO funded_loans 
                (loan_request_id, funded_loan_id, lender_id, funded_at, tx_hash, is_active) 
                VALUES (?, ?, ?, ?, ?, 1)
            ");
            $insertFundedLoanStmt->bind_param("isiss", 
                $loanRequestId, 
                $data['fundedLoanId'], 
                $lenderId, 
                $data['fundedAt'], 
                $data['txHash']
            );
            $insertFundedLoanStmt->execute();
            
            if ($insertFundedLoanStmt->affected_rows > 0) {
                $fundedLoanId = $conn->insert_id;
                logError("Successfully created funded loan with ID: $fundedLoanId");
            } else {
                throw new Exception("Failed to insert funded loan: " . $conn->error);
            }
            
            // Insert funding UTXOs
            if (!empty($data['fundedWith']) && is_array($data['fundedWith'])) {
                $insertUtxoStmt = $conn->prepare("
                    INSERT INTO funding_utxos 
                    (funded_loan_id, tx_hash, output_index) 
                    VALUES (?, ?, ?)
                ");
                
                foreach ($data['fundedWith'] as $utxo) {
                    $insertUtxoStmt->bind_param("isi", 
                        $fundedLoanId, 
                        $utxo['txHash'], 
                        $utxo['outputIndex']
                    );
                    $insertUtxoStmt->execute();
                    
                    if ($insertUtxoStmt->affected_rows <= 0) {
                        logError("Failed to insert UTXO for funded loan ID $fundedLoanId: " . $conn->error);
                    }
                }
            }
            
            $conn->commit();
            logError("Transaction committed successfully");
            echo json_encode(['status' => 'success', 'message' => 'Funded loan recorded successfully']);
        } catch (Exception $e) {
            $conn->rollback();
            $errorMsg = 'Database error: ' . $e->getMessage();
            logError($errorMsg);
            echo json_encode(['status' => 'error', 'message' => $errorMsg]);
        }
        break;
case 'getCreditScore':
    $data = json_decode(file_get_contents('php://input'), true);
    $userPkh = $data['userPKH'] ?? '';
    
    if (empty($userPkh)) {
        echo json_encode(['status' => 'error', 'message' => 'Missing user PKH']);
        exit;
    }
    
    // Get user ID from PKH
    $stmt = $conn->prepare("SELECT id FROM users WHERE payment_key_hash = ?");
    $stmt->bind_param("s", $userPkh);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows == 0) {
        echo json_encode(['status' => 'error', 'message' => 'User not found']);
        exit;
    }
    
    $user = $result->fetch_assoc();
    $userId = $user['id'];
    
    // Get credit score data
    $creditStmt = $conn->prepare("SELECT * FROM credit_scores WHERE user_id = ?");
    $creditStmt->bind_param("i", $userId);
    $creditStmt->execute();
    $creditResult = $creditStmt->get_result();
    
    if ($creditResult->num_rows == 0) {
        // Create initial credit score
        $insertStmt = $conn->prepare("INSERT INTO credit_scores (user_id) VALUES (?)");
        $insertStmt->bind_param("i", $userId);
        $insertStmt->execute();
        
        $creditData = [
            'current_score' => 500,
            'total_loans' => 0,
            'on_time_payments' => 0,
            'early_payments' => 0,
            'late_payments' => 0
        ];
    } else {
        $creditData = $creditResult->fetch_assoc();
    }
    
    echo json_encode(['status' => 'success', 'creditScore' => $creditData]);
    break;

case 'repay':
    $data = json_decode(file_get_contents('php://input'), true);
    logError("Received repay request", $data);
    
    // Required fields validation
    if (!isset($data['fundedLoanId']) || !isset($data['repaidAt']) || !isset($data['repaymentTxHash'])) {
        $error = 'Missing required fields for repayment';
        logError($error, $data);
        echo json_encode(['status' => 'error', 'message' => $error]);
        exit;
    }
    
    $conn->begin_transaction();
    try {
        // Get funded loan details including deadline and funded_at
        $fundedLoanStmt = $conn->prepare("
            SELECT fl.id, fl.loan_request_id, fl.funded_at, lr.deadline, lr.borrower_id 
            FROM funded_loans fl
            JOIN loan_requests lr ON fl.loan_request_id = lr.id
            WHERE fl.funded_loan_id = ?
        ");
        $fundedLoanStmt->bind_param("s", $data['fundedLoanId']);
        $fundedLoanStmt->execute();
        $fundedLoanResult = $fundedLoanStmt->get_result();
        
        if ($fundedLoanResult->num_rows == 0) {
            throw new Exception("Funded loan not found");
        }
        
        $fundedLoan = $fundedLoanResult->fetch_assoc();
        
        // Determine payment timing with loan start time
        $paymentTiming = determinePaymentCategory(
            $fundedLoan['deadline'], 
            $data['repaidAt'], 
            $fundedLoan['funded_at']
        );
        
        // Update loan request status
        $updateLoanRequestStmt = $conn->prepare("UPDATE loan_requests SET status = 'repaid' WHERE id = ?");
        $updateLoanRequestStmt->bind_param("i", $fundedLoan['loan_request_id']);
        $updateLoanRequestStmt->execute();
        
        // Update funded loan active status
        $updateFundedLoanStmt = $conn->prepare("UPDATE funded_loans SET is_active = 0 WHERE id = ?");
        $updateFundedLoanStmt->bind_param("i", $fundedLoan['id']);
        $updateFundedLoanStmt->execute();
        
        // Record repayment with timing information
        $insertRepaymentStmt = $conn->prepare("
            INSERT INTO repaid_loans 
            (funded_loan_id, repaid_at, repayment_tx_hash, days_early_late, payment_category) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $insertRepaymentStmt->bind_param("iisis", 
            $fundedLoan['id'], 
            $data['repaidAt'], 
            $data['repaymentTxHash'],
            $paymentTiming['days'],
            $paymentTiming['category']
        );
        $insertRepaymentStmt->execute();
        
        // Update credit score with loan duration
        $newCreditScore = updateCreditScore(
            $conn, 
            $fundedLoan['borrower_id'], 
            $paymentTiming['category'], 
            $paymentTiming['days'],
            $paymentTiming['loan_duration']
        );
        
        $conn->commit();
        logError("Loan repayment recorded successfully with credit score update");
        
        echo json_encode([
            'status' => 'success', 
            'message' => 'Loan repayment recorded successfully',
            'creditScore' => $newCreditScore,
            'paymentCategory' => $paymentTiming['category'],
            'paymentDetails' => $paymentTiming
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        $errorMsg = 'Database error: ' . $e->getMessage();
        logError($errorMsg);
        echo json_encode(['status' => 'error', 'message' => $errorMsg]);
    }
    break;
        
    case 'verify':
        $data = json_decode(file_get_contents('php://input'), true);
        $activeFundedUTXOs = $data['activeFundedUTXOs'] ?? [];
        logError("Received verify request", $data);
        
        if (empty($activeFundedUTXOs)) {
            echo json_encode(['status' => 'success', 'message' => 'No UTXOs to verify']);
            exit;
        }
        
        // Create list of active funded loan IDs
        $activeFundedIds = [];
        foreach ($activeFundedUTXOs as $utxo) {
            $activeFundedIds[] = $utxo['id'];
        }
        
        // Find loans that should be marked as inactive because they're not on-chain anymore
        $placeholders = str_repeat("?,", count($activeFundedIds) - 1) . "?";
        $sql = "
            UPDATE funded_loans 
            SET is_active = 0 
            WHERE is_active = 1 AND funded_loan_id NOT IN ($placeholders)
        ";
        
        $stmt = $conn->prepare($sql);
        $types = str_repeat("s", count($activeFundedIds));
        $stmt->bind_param($types, ...$activeFundedIds);
        $stmt->execute();
        
        logError("Loans verified successfully");
        echo json_encode(['status' => 'success', 'message' => 'Loans verified successfully']);
        break;
        
    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
}