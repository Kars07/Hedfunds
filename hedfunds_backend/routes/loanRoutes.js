const express = require('express');
const router = express.Router();
const LoanService = require('../services/loanService');

// Initialize loan service
const loanService = new LoanService();

// Middleware for error handling
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware for request validation
const validateRequired = (fields) => (req, res, next) => {
    const missingFields = fields.filter(field => {
        const value = req.body[field] || req.params[field] || req.query[field];
        return !value;
    });
    
    if (missingFields.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: `Missing required fields: ${missingFields.join(', ')}`
        });
    }
    next();
};

/**
 * @route POST /api/loans/users
 * @desc Register or get user
 * @access Public
 */
/**
 * @route POST /api/loans/users
 * @desc Register or get user
 * @access Public
 */
router.post('/users', 
    validateRequired(['pkh']),
    asyncHandler(async (req, res) => {
        const { address, pkh } = req.body;
        
        try {
            const user = await loanService.getOrCreateUser(pkh, address);
            res.status(200).json({
                status: 'success',
                message: 'User registered successfully',
                user: {
                    id: user._id,
                    walletAddress: user.walletAddress,
                    paymentKeyHash: user.paymentKeyHash
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Failed to register user',
                details: error.message
            });
        }
    })
);

/**
 * @route GET /api/loans/funded/ids
 * @desc Get all funded loan IDs
 * @access Public
 */
router.get('/funded/ids', asyncHandler(async (req, res) => {
    const result = await loanService.getAllFundedLoanIds();
    
    if (result.status === 'success') {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
}));

/**
 * @route GET /api/loans/original/:fundedLoanId
 * @desc Get original loan ID from funded loan ID
 * @access Public
 */
router.get('/original/:fundedLoanId', asyncHandler(async (req, res) => {
    const { fundedLoanId } = req.params;
    const result = await loanService.getOriginalLoanId(fundedLoanId);
    
    if (result.status === 'success') {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
}));

/**
 * @route GET /api/loans/wallet/:pkh
 * @desc Get wallet address from payment key hash
 * @access Public
 */
router.get('/wallet/:pkh', asyncHandler(async (req, res) => {
    const { pkh } = req.params;
    const result = await loanService.getWalletFromPKH(pkh);
    
    if (result.status === 'success') {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
}));

/**
 * @route GET /api/loans/borrower/:borrowerPKH
 * @desc Get all loans for a borrower
 * @access Public
 */
router.get('/borrower/:borrowerPKH', asyncHandler(async (req, res) => {
    const { borrowerPKH } = req.params;
    const result = await loanService.getBorrowerLoans(borrowerPKH);
    
    if (result.status === 'success') {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
}));

/**
 * @route GET /api/loans/borrower/:borrowerPKH/repaid
 * @desc Get all repaid loans for a borrower
 * @access Public
 */
router.get('/borrower/:borrowerPKH/repaid', asyncHandler(async (req, res) => {
    const { borrowerPKH } = req.params;
    const result = await loanService.getBorrowerRepaidLoans(borrowerPKH);
    
    if (result.status === 'success') {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
}));

/**
 * @route GET /api/loans/lender/:lenderPKH
 * @desc Get all funded loans for a lender
 * @access Public
 */
router.get('/lender/:lenderPKH', asyncHandler(async (req, res) => {
    const { lenderPKH } = req.params;
    const result = await loanService.getLenderLoans(lenderPKH);
    
    if (result.status === 'success') {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
}));

/**
 * @route POST /api/loans/funded
 * @desc Add a new funded loan
 * @access Public
 */
router.post('/funded', 
    validateRequired(['loanId', 'fundedLoanId', 'lenderPKH', 'borrowerPKH', 'loanAmount', 'interest', 'deadline', 'txHash', 'fundedWith', 'fundedAt']),
    asyncHandler(async (req, res) => {
        const result = await loanService.addFundedLoan(req.body);
        
        if (result.status === 'success') {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    })
);

/**
 * @route GET /api/loans/credit-score/:userPKH
 * @desc Get credit score for a user
 * @access Public
 */
router.get('/credit-score/:userPKH', asyncHandler(async (req, res) => {
    const { userPKH } = req.params;
    const result = await loanService.getCreditScore(userPKH);
    
    if (result.status === 'success') {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
}));

/**
 * @route POST /api/loans/repay
 * @desc Record loan repayment
 * @access Public
 */
router.post('/repay',
    validateRequired(['fundedLoanId', 'repaidAt', 'repaymentTxHash']),
    asyncHandler(async (req, res) => {
        const result = await loanService.repayLoan(req.body);
        
        if (result.status === 'success') {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    })
);

/**
 * @route POST /api/loans/verify
 * @desc Verify active loans against on-chain UTXOs
 * @access Public
 */
router.post('/verify', asyncHandler(async (req, res) => {
    const { activeFundedUTXOs } = req.body;
    const result = await loanService.verifyLoans(activeFundedUTXOs);
    
    if (result.status === 'success') {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
}));

/**
 * @route POST /api/loans/action
 * @desc Generic action handler (matches PHP switch structure)
 * @access Public
 */
router.post('/action', asyncHandler(async (req, res) => {
    const { action, ...data } = req.body;
    
    if (!action) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing action parameter'
        });
    }
    
    const result = await loanService.handleAction(action, data);
    
    if (result.status === 'success') {
        // Return appropriate status code based on action
        const statusCode = action === 'add' ? 201 : 200;
        res.status(statusCode).json(result);
    } else {
        const statusCode = result.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json(result);
    }
}));

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Loan routes error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Validation error',
            details: error.message
        });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
        return res.status(409).json({
            status: 'error',
            message: 'Duplicate entry',
            details: error.message
        });
    }
    
    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid ID format',
            details: error.message
        });
    }
    
    // Default error response
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

module.exports = router;