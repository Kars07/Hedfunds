// utils/creditScore.js
const RepaidLoan = require('../models/RepaidLoan');
const FundedLoan = require('../models/FundedLoan');
const LoanRequest = require('../models/LoanRequest');

// Function to calculate credit score based on payment history and timing
function calculateCreditScore(totalLoans, onTimePayments, earlyPayments, latePayments, paymentDetails = []) {
    const baseScore = 500;
    if (totalLoans === 0) return baseScore;
    
    let score = baseScore;
    
    // Experience bonus (up to +50 points for having more loans)
    if (totalLoans >= 10) {
        score += 50;
    } else if (totalLoans >= 5) {
        score += 25;
    } else if (totalLoans >= 2) {
        score += 10;
    }
    
    // If we have detailed payment data, use dynamic scoring
    if (paymentDetails.length > 0) {
        score += calculateDynamicScore(paymentDetails);
    } else {
        // Fallback to old percentage-based calculation
        const onTimePercentage = (onTimePayments / totalLoans) * 100;
        const earlyPercentage = (earlyPayments / totalLoans) * 100;
        const latePercentage = (latePayments / totalLoans) * 100;
        
        score += (onTimePercentage * 2);
        score += (earlyPercentage * 1);
        score -= (latePercentage * 3);
    }
    
    // Ensure score is within reasonable bounds
    score = Math.max(300, Math.min(850, score));
    return Math.round(score);
}

// Function to calculate dynamic score based on detailed payment timing
function calculateDynamicScore(paymentDetails) {
    let totalScore = 0;
    
    for (const payment of paymentDetails) {
        const { category, days, loanDuration = 30 } = payment;
        
        switch (category) {
            case 'early':
                totalScore += calculateEarlyScore(days, loanDuration);
                break;
                
            case 'on_time':
                totalScore += calculateOnTimeScore(days, loanDuration);
                break;
                
            case 'late':
                totalScore += calculateLateScore(days);
                break;
        }
    }
    
    return totalScore;
}

// Function to calculate early payment score
function calculateEarlyScore(daysEarly, loanDuration) {
    const earlyThreshold25 = loanDuration * 0.25; // First 25% of loan duration
    const earlyThreshold50 = loanDuration * 0.50; // First 50% of loan duration
    
    if (daysEarly >= earlyThreshold25) {
        // Very early - within first 25% of loan duration
        return 100;
    } else if (daysEarly >= earlyThreshold50) {
        // Early - within first 50% of loan duration
        return 75;
    } else {
        // Less early but still early
        return 50;
    }
}

// Function to calculate on-time payment score
function calculateOnTimeScore(daysBeforeDeadline, loanDuration) {
    const onTimeThreshold75 = loanDuration * 0.75; // First 75% of loan duration
    
    if (daysBeforeDeadline >= onTimeThreshold75) {
        // On-time - within first 75% of loan duration
        return 50;
    } else if (daysBeforeDeadline > 5) {
        // More than 5 days before deadline
        return 35;
    } else if (daysBeforeDeadline >= 1 && daysBeforeDeadline <= 5) {
        // 1-5 days before deadline
        return 15;
    } else {
        // On deadline day (same day)
        return 0;
    }
}

// Function to calculate late payment score (negative points)
function calculateLateScore(daysLate) {
    if (daysLate === 1) {
        // 1 day late
        return -5;
    } else if (daysLate >= 2 && daysLate <= 5) {
        // 2-5 days late
        return -30;
    } else {
        // More than 5 days late
        return -50;
    }
}

// Function to determine payment category with more detailed timing
function determinePaymentCategory(deadline, repaidAt, loanStartTime = null) {
    const deadlineTime = parseInt(deadline);
    const repaymentTime = parseInt(repaidAt);
    const daysDifference = (repaymentTime - deadlineTime) / (24 * 60 * 60 * 1000); // Convert to days
    
    // Calculate loan duration if start time is provided
    let loanDuration = 30; // Default 30 days
    if (loanStartTime) {
        loanDuration = (deadlineTime - parseInt(loanStartTime)) / (24 * 60 * 60 * 1000);
    }
    
    if (daysDifference <= -1) {
        return {
            category: 'early',
            days: Math.abs(daysDifference),
            loanDuration: loanDuration
        };
    } else if (daysDifference >= 1) {
        return {
            category: 'late',
            days: daysDifference,
            loanDuration: loanDuration
        };
    } else {
        return {
            category: 'on_time',
            days: Math.abs(daysDifference),
            loanDuration: loanDuration
        };
    }
}

// Helper function to get detailed payment history for a user
async function getPaymentDetailsForUser(userId) {
    try {
        const repaidLoans = await RepaidLoan.aggregate([
            {
                $lookup: {
                    from: 'fundedloans',
                    localField: 'fundedLoanId',
                    foreignField: '_id',
                    as: 'fundedLoan'
                }
            },
            { $unwind: '$fundedLoan' },
            {
                $lookup: {
                    from: 'loanrequests',
                    localField: 'fundedLoan.loanRequestId',
                    foreignField: '_id',
                    as: 'loanRequest'
                }
            },
            { $unwind: '$loanRequest' },
            {
                $match: {
                    'loanRequest.borrowerId': userId
                }
            },
            {
                $addFields: {
                    loanDurationDays: {
                        $divide: [
                            {
                                $subtract: [
                                    { $toDouble: '$loanRequest.deadline' },
                                    '$fundedLoan.fundedAt'
                                ]
                            },
                            86400000 // Convert to days
                        ]
                    }
                }
            },
            {
                $project: {
                    paymentCategory: 1,
                    daysEarlyLate: 1,
                    loanDurationDays: { $max: [1, '$loanDurationDays'] }
                }
            },
            { $sort: { repaidAt: -1 } }
        ]);

        return repaidLoans.map(loan => ({
            category: loan.paymentCategory,
            days: parseFloat(loan.daysEarlyLate),
            loanDuration: Math.max(1, parseInt(loan.loanDurationDays))
        }));

    } catch (error) {
        console.error('Error getting payment details:', error);
        return [];
    }
}

module.exports = {
    calculateCreditScore,
    calculateDynamicScore,
    calculateEarlyScore,
    calculateOnTimeScore,
    calculateLateScore,
    determinePaymentCategory,
    getPaymentDetailsForUser
};