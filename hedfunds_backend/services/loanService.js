const User = require('../models/Wallet');
const LoanRequest = require('../models/LoanRequest');
const FundedLoan = require('../models/FundedLoan');
const FundingUtxo = require('../models/FundingUtxo');
const RepaidLoan = require('../models/RepaidLoan');
const CreditScore = require('../models/CreditScore');
const mongoose = require('mongoose');
const { 
    calculateCreditScore, 
    determinePaymentCategory, 
    getPaymentDetailsForUser 
} = require('../utils/creditScore');

class LoanService {
    // Helper method to get or create user
    async getOrCreateUser(paymentKeyHash, walletAddress = null) {
        let user = await User.findOne({ paymentKeyHash });
        
        if (!user) {
            const address = walletAddress || `wallet_${paymentKeyHash.substring(0, 10)}`;
            user = new User({
                walletAddress: address,
                paymentKeyHash: paymentKeyHash
            });
            await user.save();
            console.log(`Created new user with ID: ${user._id}`);
        }
        
        return user;
    }

    // Helper method to get or create loan request
    async getOrCreateLoanRequest(loanId, borrowerId, loanAmount, interest, deadline) {
        let loanRequest = await LoanRequest.findOne({ loanId });
        
        if (!loanRequest) {
            loanRequest = new LoanRequest({
                loanId,
                borrowerId,
                loanAmount,
                interest,
                deadline,
                status: 'funded'
            });
            await loanRequest.save();
            console.log(`Created new loan request with ID: ${loanRequest._id}`);
        } else {
            // Update status if it exists
            loanRequest.status = 'funded';
            await loanRequest.save();
            console.log(`Updated existing loan request with ID: ${loanRequest._id}`);
        }
        
        return loanRequest;
    }

    // Function to update credit score with detailed payment tracking
    async updateCreditScore(userId, paymentCategory, daysEarlyLate, loanDuration = 30) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            // Get current credit score data
            let creditScore = await CreditScore.findOne({ userId }).session(session);
            
            if (!creditScore) {
                // Create initial credit score record
                creditScore = new CreditScore({ userId });
                await creditScore.save({ session });
            }
            
            // Update counters based on payment category
            const newTotalLoans = creditScore.totalLoans + 1;
            let newOnTimePayments = creditScore.onTimePayments;
            let newEarlyPayments = creditScore.earlyPayments;
            let newLatePayments = creditScore.latePayments;
            
            switch (paymentCategory) {
                case 'early':
                    newEarlyPayments++;
                    break;
                case 'on_time':
                    newOnTimePayments++;
                    break;
                case 'late':
                    newLatePayments++;
                    break;
            }
            
            // Get all payment details for this user for dynamic scoring
            const paymentDetails = await getPaymentDetailsForUser(userId);
            
            // Add current payment to details
            paymentDetails.push({
                category: paymentCategory,
                days: daysEarlyLate,
                loanDuration: loanDuration
            });
            
            // Calculate new credit score with dynamic scoring
            const newScore = calculateCreditScore(
                newTotalLoans, 
                newOnTimePayments, 
                newEarlyPayments, 
                newLatePayments, 
                paymentDetails
            );
            
            // Update credit score record
            creditScore.currentScore = newScore;
            creditScore.totalLoans = newTotalLoans;
            creditScore.onTimePayments = newOnTimePayments;
            creditScore.earlyPayments = newEarlyPayments;
            creditScore.latePayments = newLatePayments;
            
            await creditScore.save({ session });
            
            await session.commitTransaction();
            console.log(`Credit score updated for user ${userId}: ${newScore}`);
            return newScore;
            
        } catch (error) {
            await session.abortTransaction();
            console.error('Error updating credit score:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    // Get all funded loan IDs - matches 'getAllFundedLoanIds' case
    async getAllFundedLoanIds() {
        try {
            const result = await FundedLoan.aggregate([
                {
                    $lookup: {
                        from: 'loanrequests',
                        localField: 'loanRequestId',
                        foreignField: '_id',
                        as: 'loanRequest'
                    }
                },
                { $unwind: '$loanRequest' },
                {
                    $group: {
                        _id: '$loanRequest.loanId'
                    }
                },
                {
                    $project: {
                        _id: 0,
                        loanId: '$_id'
                    }
                }
            ]);
            
            return {
                status: 'success',
                loanIds: result.map(item => item.loanId)
            };
        } catch (error) {
            console.error("Error fetching all funded loan IDs:", error.message);
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    // Get original loan ID from funded loan ID - matches 'getOriginalLoanId' case
    async getOriginalLoanId(fundedLoanId) {
        try {
            if (!fundedLoanId) {
                return {
                    status: 'error',
                    message: 'Missing funded loan ID'
                };
            }

            const result = await FundedLoan.aggregate([
                { $match: { fundedLoanId } },
                {
                    $lookup: {
                        from: 'loanrequests',
                        localField: 'loanRequestId',
                        foreignField: '_id',
                        as: 'loanRequest'
                    }
                },
                { $unwind: '$loanRequest' },
                {
                    $project: {
                        originalLoanId: '$loanRequest.loanId'
                    }
                }
            ]);
            
            if (result.length > 0) {
                return {
                    status: 'success',
                    originalLoanId: result[0].originalLoanId
                };
            } else {
                return {
                    status: 'error',
                    message: 'Funded loan not found'
                };
            }
        } catch (error) {
            console.error("Error getting original loan ID:", error.message);
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    // Get wallet address from PKH - matches 'getWalletFromPKH' and 'getByPKH' cases
    async getWalletFromPKH(pkh) {
        try {
            if (!pkh) {
                return {
                    status: 'error',
                    message: 'Missing PKH'
                };
            }

            const user = await User.findOne({ paymentKeyHash: pkh });
            
            if (user) {
                return {
                    status: 'success',
                    walletAddress: user.walletAddress
                };
            } else {
                return {
                    status: 'error',
                    message: 'User not found'
                };
            }
        } catch (error) {
            return {
                status: 'error',
                message: 'Database error: ' + error.message
            };
        }
    }

    // Get borrower loans - matches 'getBorrowerLoans' case
    async getBorrowerLoans(borrowerPKH) {
        try {
            if (!borrowerPKH) {
                return {
                    status: 'error',
                    message: 'Missing borrower PKH'
                };
            }

            const user = await User.findOne({ paymentKeyHash: borrowerPKH });
            if (!user) {
                return {
                    status: 'error',
                    message: 'User not found'
                };
            }

            const loans = await FundedLoan.aggregate([
                {
                    $lookup: {
                        from: 'loanrequests',
                        localField: 'loanRequestId',
                        foreignField: '_id',
                        as: 'loanRequest'
                    }
                },
                { $unwind: '$loanRequest' },
                {
                    $match: {
                        'loanRequest.borrowerId': user._id,
                        isActive: true
                    }
                },
                {
                    $lookup: {
                        from: 'wallets',
                        localField: 'lenderId',
                        foreignField: '_id',
                        as: 'lender'
                    }
                },
                { $unwind: '$lender' },
                {
                    $lookup: {
                        from: 'repaidloans',
                        localField: '_id',
                        foreignField: 'fundedLoanId',
                        as: 'repayment'
                    }
                },
                {
                    $project: {
                        loanId: '$loanRequest.loanId',
                        fundedLoanId: '$fundedLoanId',
                        fundedAt: '$fundedAt',
                        lenderPKH: '$lender.paymentKeyHash',
                        borrowerPKH: borrowerPKH,
                        loanAmount: '$loanRequest.loanAmount',
                        interest: '$loanRequest.interest',
                        deadline: '$loanRequest.deadline',
                        txHash: '$txHash',
                        isActive: '$isActive',
                        repaymentInfo: {
                            $cond: {
                                if: { $gt: [{ $size: '$repayment' }, 0] },
                                then: {
                                    repaidAt: { $arrayElemAt: ['$repayment.repaidAt', 0] },
                                    repaymentTxHash: { $arrayElemAt: ['$repayment.repaymentTxHash', 0] }
                                },
                                else: null
                            }
                        }
                    }
                },
                { $sort: { fundedAt: -1 } }
            ]);

            return {
                status: 'success',
                loans: loans
            };
        } catch (error) {
            console.error("Error getting borrower loans:", error.message);
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    // Get borrower repaid loans - matches 'getBorrowerRepaidLoans' case
    async getBorrowerRepaidLoans(borrowerPKH) {
        try {
            if (!borrowerPKH) {
                return {
                    status: 'error',
                    message: 'Missing borrower PKH'
                };
            }

            const user = await User.findOne({ paymentKeyHash: borrowerPKH });
            if (!user) {
                return {
                    status: 'error',
                    message: 'User not found'
                };
            }

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
                        'loanRequest.borrowerId': user._id
                    }
                },
                {
                    $lookup: {
                        from: 'wallets',
                        localField: 'fundedLoan.lenderId',
                        foreignField: '_id',
                        as: 'lender'
                    }
                },
                { $unwind: '$lender' },
                {
                    $project: {
                        id: '$fundedLoan.fundedLoanId',
                        data: {
                            repaidAt: '$repaidAt',
                            repaymentTxHash: '$repaymentTxHash',
                            loanAmount: '$loanRequest.loanAmount',
                            interest: '$loanRequest.interest',
                            originalLoanId: '$loanRequest.loanId',
                            lenderPKH: '$lender.paymentKeyHash',
                            borrowerPKH: borrowerPKH,
                            deadline: '$loanRequest.deadline',
                            fundedAt: '$fundedLoan.fundedAt',
                            paymentCategory: '$paymentCategory',
                            daysEarlyLate: '$daysEarlyLate'
                        }
                    }
                },
                { $sort: { repaidAt: -1 } }
            ]);

            return {
                status: 'success',
                repaidLoans: repaidLoans
            };
        } catch (error) {
            console.error("Error getting borrower repaid loans:", error.message);
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    // Get lender funded loans - matches 'get' case
    async getLenderLoans(lenderPKH) {
        try {
            if (!lenderPKH) {
                return {
                    status: 'error',
                    message: 'Missing lender PKH'
                };
            }

            const user = await User.findOne({ paymentKeyHash: lenderPKH });
            if (!user) {
                return {
                    status: 'error',
                    message: 'User not found'
                };
            }

            const loans = await FundedLoan.aggregate([
                { $match: { lenderId: user._id } },
                {
                    $lookup: {
                        from: 'loanrequests',
                        localField: 'loanRequestId',
                        foreignField: '_id',
                        as: 'loanRequest'
                    }
                },
                { $unwind: '$loanRequest' },
                {
                    $lookup: {
                        from: 'wallets',
                        localField: 'loanRequest.borrowerId',
                        foreignField: '_id',
                        as: 'borrower'
                    }
                },
                { $unwind: '$borrower' },
                {
                    $lookup: {
                        from: 'repaidloans',
                        localField: '_id',
                        foreignField: 'fundedLoanId',
                        as: 'repayment'
                    }
                },
                {
                    $lookup: {
                        from: 'fundingutxos',
                        localField: '_id',
                        foreignField: 'fundedLoanId',
                        as: 'utxos'
                    }
                },
                {
                    $project: {
                        loanId: '$loanRequest.loanId',
                        fundedLoanId: '$fundedLoanId',
                        fundedAt: '$fundedAt',
                        lenderPKH: lenderPKH,
                        borrowerPKH: '$borrower.paymentKeyHash',
                        loanAmount: '$loanRequest.loanAmount',
                        interest: '$loanRequest.interest',
                        deadline: '$loanRequest.deadline',
                        txHash: '$txHash',
                        isActive: '$isActive',
                        fundedWith: {
                            $map: {
                                input: '$utxos',
                                as: 'utxo',
                                in: {
                                    txHash: '$$utxo.txHash',
                                    outputIndex: '$$utxo.outputIndex'
                                }
                            }
                        },
                        repaymentInfo: {
                            $cond: {
                                if: { $gt: [{ $size: '$repayment' }, 0] },
                                then: {
                                    repaidAt: { $arrayElemAt: ['$repayment.repaidAt', 0] },
                                    repaymentTxHash: { $arrayElemAt: ['$repayment.repaymentTxHash', 0] }
                                },
                                else: null
                            }
                        }
                    }
                },
                { $sort: { fundedAt: -1 } }
            ]);

            return {
                status: 'success',
                loans: loans
            };
        } catch (error) {
            console.error("Error getting lender loans:", error.message);
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    // Add funded loan - matches 'add' case
    async addFundedLoan(loanData) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            console.log("Received add request", loanData);

            // Required fields validation
            const requiredFields = ['loanId', 'fundedLoanId', 'lenderPKH', 'borrowerPKH', 'loanAmount', 
                                  'interest', 'deadline', 'txHash', 'fundedWith', 'fundedAt'];
            for (const field of requiredFields) {
                if (!loanData[field]) {
                    const error = `Missing required field: ${field}`;
                    console.error(error);
                    return {
                        status: 'error',
                        message: error
                    };
                }
            }

            const {
                loanId, fundedLoanId, lenderPKH, borrowerPKH,
                loanAmount, interest, deadline, txHash, fundedWith, fundedAt
            } = loanData;

            // Get or create users
            const lender = await this.getOrCreateUser(lenderPKH);
            const borrower = await this.getOrCreateUser(borrowerPKH);

            // Get or create loan request
            const loanRequest = await this.getOrCreateLoanRequest(
                loanId, borrower._id, loanAmount, interest, deadline
            );

            // Check if funded loan already exists
            const existingFundedLoan = await FundedLoan.findOne({ fundedLoanId }).session(session);
            if (existingFundedLoan) {
                await session.commitTransaction();
                console.log("Funded loan already exists with ID:", existingFundedLoan._id);
                return {
                    status: 'success',
                    message: 'Funded loan already recorded'
                };
            }

            // Create funded loan
            const fundedLoan = new FundedLoan({
                loanRequestId: loanRequest._id,
                fundedLoanId,
                lenderId: lender._id,
                fundedAt,
                txHash,
                isActive: true
            });

            await fundedLoan.save({ session });
            console.log("Successfully created funded loan with ID:", fundedLoan._id);

            // Create funding UTXOs
            if (fundedWith && Array.isArray(fundedWith)) {
                const utxos = fundedWith.map(utxo => ({
                    fundedLoanId: fundedLoan._id,
                    txHash: utxo.txHash,
                    outputIndex: utxo.outputIndex
                }));

                await FundingUtxo.insertMany(utxos, { session });
            }

            await session.commitTransaction();
            console.log('Transaction committed successfully');
            return {
                status: 'success',
                message: 'Funded loan recorded successfully'
            };

        } catch (error) {
            await session.abortTransaction();
            const errorMsg = 'Database error: ' + error.message;
            console.error(errorMsg);
            return {
                status: 'error',
                message: errorMsg
            };
        } finally {
            session.endSession();
        }
    }

    // Get credit score - matches 'getCreditScore' case
    async getCreditScore(userPKH) {
        try {
            if (!userPKH) {
                return {
                    status: 'error',
                    message: 'Missing user PKH'
                };
            }

            const user = await User.findOne({ paymentKeyHash: userPKH });
            if (!user) {
                return {
                    status: 'error',
                    message: 'User not found'
                };
            }

            let creditScore = await CreditScore.findOne({ userId: user._id });
            
            if (!creditScore) {
                // Create initial credit score
                creditScore = new CreditScore({ userId: user._id });
                await creditScore.save();
                
                creditScore = {
                    current_score: 500,
                    total_loans: 0,
                    on_time_payments: 0,
                    early_payments: 0,
                    late_payments: 0
                };
            } else {
                creditScore = {
                    current_score: creditScore.currentScore,
                    total_loans: creditScore.totalLoans,
                    on_time_payments: creditScore.onTimePayments,
                    early_payments: creditScore.earlyPayments,
                    late_payments: creditScore.latePayments
                };
            }

            return {
                status: 'success',
                creditScore: creditScore
            };
        } catch (error) {
            console.error("Error getting credit score:", error.message);
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    // Repay loan - matches 'repay' case
    async repayLoan(repaymentData) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            console.log("Received repay request", repaymentData);

            // Required fields validation
            if (!repaymentData.fundedLoanId || !repaymentData.repaidAt || !repaymentData.repaymentTxHash) {
                const error = 'Missing required fields for repayment';
                console.error(error, repaymentData);
                return {
                    status: 'error',
                    message: error
                };
            }

            const { fundedLoanId, repaidAt, repaymentTxHash } = repaymentData;

            // Get funded loan details including deadline and funded_at
            const fundedLoan = await FundedLoan.findOne({ fundedLoanId })
                .populate('loanRequestId')
                .session(session);

            if (!fundedLoan) {
                throw new Error('Funded loan not found');
            }

            // Determine payment timing with loan start time
            const paymentTiming = determinePaymentCategory(
                fundedLoan.loanRequestId.deadline,
                repaidAt,
                fundedLoan.fundedAt
            );

            // Update loan request status
            await LoanRequest.findByIdAndUpdate(
                fundedLoan.loanRequestId._id,
                { status: 'repaid' },
                { session }
            );

            // Update funded loan active status
            await FundedLoan.findByIdAndUpdate(
                fundedLoan._id,
                { isActive: false },
                { session }
            );

            // Record repayment with timing information
            const repaidLoan = new RepaidLoan({
                fundedLoanId: fundedLoan._id,
                repaidAt,
                repaymentTxHash,
                daysEarlyLate: paymentTiming.days,
                paymentCategory: paymentTiming.category
            });

            await repaidLoan.save({ session });

            // Update credit score with loan duration
            const newCreditScore = await this.updateCreditScore(
                fundedLoan.loanRequestId.borrowerId,
                paymentTiming.category,
                paymentTiming.days,
                paymentTiming.loan_duration
            );

            await session.commitTransaction();
            console.log("Loan repayment recorded successfully with credit score update");

            return {
                status: 'success',
                message: 'Loan repayment recorded successfully',
                creditScore: newCreditScore,
                paymentCategory: paymentTiming.category,
                paymentDetails: paymentTiming
            };

        } catch (error) {
            await session.abortTransaction();
            const errorMsg = 'Database error: ' + error.message;
            console.error(errorMsg);
            return {
                status: 'error',
                message: errorMsg
            };
        } finally {
            session.endSession();
        }
    }

    // Verify loans - matches 'verify' case
    async verifyLoans(activeFundedUTXOs) {
        try {
            console.log("Received verify request", { activeFundedUTXOs });

            if (!activeFundedUTXOs || activeFundedUTXOs.length === 0) {
                return {
                    status: 'success',
                    message: 'No UTXOs to verify'
                };
            }

            // Create list of active funded loan IDs
            const activeFundedIds = activeFundedUTXOs.map(utxo => utxo.id);

            // Find loans that should be marked as inactive because they're not on-chain anymore
            await FundedLoan.updateMany(
                {
                    isActive: true,
                    fundedLoanId: { $nin: activeFundedIds }
                },
                { isActive: false }
            );

            console.log("Loans verified successfully");
            return {
                status: 'success',
                message: 'Loans verified successfully'
            };
        } catch (error) {
            console.error("Error verifying loans:", error.message);
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    // Main handler method to match PHP switch structure
    async handleAction(action, data) {
        switch (action) {
            case 'getAllFundedLoanIds':
                return await this.getAllFundedLoanIds();
                
            case 'getOriginalLoanId':
                return await this.getOriginalLoanId(data.fundedLoanId);
                
            case 'getBorrowerLoans':
                return await this.getBorrowerLoans(data.borrowerPKH);
                
            case 'getBorrowerRepaidLoans':
                return await this.getBorrowerRepaidLoans(data.borrowerPKH);
                
            case 'getWalletFromPKH':
            case 'getByPKH':
                return await this.getWalletFromPKH(data.pkh);
                
            case 'get':
                return await this.getLenderLoans(data.lenderPKH);
                
            case 'add':
                return await this.addFundedLoan(data);
                
            case 'getCreditScore':
                return await this.getCreditScore(data.userPKH);
                
            case 'repay':
                return await this.repayLoan(data);
                
            case 'verify':
                return await this.verifyLoans(data.activeFundedUTXOs);
                
            default:
                return {
                    status: 'error',
                    message: 'Invalid action'
                };
        }
    }
}

module.exports = LoanService;