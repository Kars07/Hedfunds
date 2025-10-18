import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "./Dashboard";

// loan request fee constants (in Naira)
const STANDARD_LOAN_FEE = 2000; // 2,000 Naira
const PREMIUM_LOAN_FEE = 5000; // 5,000 Naira
const MAX_LOAN_AMOUNT = 500000; // Maximum loan amount in Naira

const API_URL = "https://swiftfund-6b61.onrender.com/api/loans";

type CreditScoreData = {
    current_score: number;
    total_loans: number;
    on_time_payments: number;
    early_payments: number;
    late_payments: number;
};

const Applications: React.FC = () => {
    const { 
        connection, 
        wallets, 
        connectWallet, 
        isConnecting,
    } = useWallet();
    
    // Credit score state
    const [creditScore, setCreditScore] = useState<CreditScoreData | null>(null);
    const [loadingCreditScore, setLoadingCreditScore] = useState<boolean>(false);
    
    // Loan request form state - in Naira
    const [loanAmountNaira, setLoanAmountNaira] = useState<number>(50000);
    const [interestNaira, setInterestNaira] = useState<number>(10000);
    const [deadlineDays, setDeadlineDays] = useState<number>(7);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [requestId, setRequestId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [inputError, setInputError] = useState<{
        loanAmount?: string;
        interest?: string;
        deadline?: string;
    }>({});

    // Fetch credit score when wallet is connected
    const fetchCreditScore = useCallback(async (userId: string): Promise<void> => {
        try {
            setLoadingCreditScore(true);
            const response = await fetch(`${API_URL}/credit-score/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            const data = await response.json();
            console.log('Credit score response:', data);
            
            if (data.status === 'success') {
                setCreditScore(data.creditScore);
            } else {
                console.error("Error fetching credit score:", data.message);
                // Set default credit score for new users
                setCreditScore({
                    current_score: 300,
                    total_loans: 0,
                    on_time_payments: 0,
                    early_payments: 0,
                    late_payments: 0
                });
            }
        } catch (error) {
            console.error("Error fetching credit score:", error);
            // Set default credit score for new users
            setCreditScore({
                current_score: 300,
                total_loans: 0,
                on_time_payments: 0,
                early_payments: 0,
                late_payments: 0
            });
        } finally {
            setLoadingCreditScore(false);
        }
    }, []);

    // Load credit score when connection is established
    useEffect(() => {
        if (connection && connection.address) {
            fetchCreditScore(connection.address);
        }
    }, [connection, fetchCreditScore]);

    // Get maximum loan amount based on credit score
    const getMaxLoanAmountByCreditScore = useCallback((creditScore: number): number => {
        if (creditScore >= 750) return MAX_LOAN_AMOUNT;
        if (creditScore >= 650) return 100000;
        if (creditScore >= 550) return 80000;
        return 40000;
    }, []);

    // Get credit score color
    const getCreditScoreColor = useCallback((score: number): string => {
        if (score >= 750) return 'text-green-600';
        if (score >= 650) return 'text-blue-600';
        if (score >= 550) return 'text-yellow-600';
        return 'text-red-600';
    }, []);

    // Get credit score label
    const getCreditScoreLabel = useCallback((score: number): string => {
        if (score >= 750) return 'Excellent';
        if (score >= 650) return 'Good';
        if (score >= 550) return 'Fair';
        return 'Poor';
    }, []);

    // Get risk level
    const getRiskLevel = useCallback((score: number): string => {
        if (score >= 750) return 'Very Low Risk';
        if (score >= 650) return 'Low Risk';
        if (score >= 550) return 'Moderate Risk';
        return 'High Risk';
    }, []);
    
    // Format Naira currency
    const formatNaira = useCallback((amount: number): string => {
        return amount.toLocaleString('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }, []);

    // Determine loan request fee based on loan amount
    const getLoanRequestFee = useCallback((loanAmountNaira: number): number => {
        if (loanAmountNaira <= 100000) {
            return STANDARD_LOAN_FEE;
        } else if (loanAmountNaira <= 500000) {
            return PREMIUM_LOAN_FEE;
        } else {
            throw new Error("Loan amount exceeds maximum allowed");
        }
    }, []);

    // Get loan type name based on amount
    const getLoanTypeName = useCallback((loanAmountNaira: number): string => {
        if (loanAmountNaira <= 100000) {
            return "Standard Loan";
        } else {
            return "Premium Loan";
        }
    }, []);

    // Handle loan amount change with validation
    const handleLoanAmountChange = useCallback((value: number): void => {
        setInputError(prev => ({ ...prev, loanAmount: undefined }));
        
        const maxAmount = creditScore ? getMaxLoanAmountByCreditScore(creditScore.current_score) : 40000;
        
        if (value > maxAmount) {
            setInputError(prev => ({ 
                ...prev, 
                loanAmount: `Your credit score (${creditScore?.current_score || 'N/A'}) limits you to a maximum of ${formatNaira(maxAmount)}`
            }));
            setLoanAmountNaira(value);
        } else {
            setLoanAmountNaira(value);
        }
    }, [creditScore, getMaxLoanAmountByCreditScore, formatNaira]);

    // Create loan request function
    const createLoanRequest = useCallback(async (): Promise<void> => {
        if (!connection) {
            setError("Please connect your wallet first");
            return;
        }

        if (!creditScore) {
            setError("Credit score not loaded. Please wait a moment and try again.");
            return;
        }

        if (loanAmountNaira <= 0) {
            setError("Loan amount must be greater than zero");
            return;
        }

        const maxAmount = getMaxLoanAmountByCreditScore(creditScore.current_score);
        
        if (loanAmountNaira > maxAmount) {
            setError(`Your credit score (${creditScore.current_score}) limits you to a maximum loan of ${formatNaira(maxAmount)}`);
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            setRequestId(null);
            
            const userId = connection.address;
            
            // Get the appropriate loan request fee
            const loanFee = getLoanRequestFee(loanAmountNaira);
            
            // Create the deadline date
            const deadline = new Date(Date.now() + 1000 * 60 * 60 * 24 * deadlineDays);
            
            // Submit loan request to API
            const response = await fetch(`${API_URL}/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    loanAmount: loanAmountNaira,
                    interest: interestNaira,
                    deadline: deadline.toISOString(),
                    applicationFee: loanFee,
                    creditScore: creditScore.current_score
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                console.log("Loan request submitted successfully. Request ID:", data.requestId);
                setRequestId(data.requestId);
            } else {
                throw new Error(data.message || 'Failed to submit loan request');
            }
            
        } catch (error) {
            console.error("Error creating loan request:", error);
            setError("Failed to create loan request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }, [
        connection,
        creditScore,
        loanAmountNaira,
        interestNaira,
        deadlineDays,
        getMaxLoanAmountByCreditScore,
        formatNaira,
        getLoanRequestFee
    ]);

    return (
        <div className="min-h-screen text-gray-900 relative overflow-hidden">
        
            {/* Animated Background Elements */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-20 left-20 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                <div className="absolute top-40 right-20 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
                <div className="absolute -bottom-8 left-40 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
            </div>

        <div className="relative z-10 p-4 pl-9 pt-5 max-w-6xl mx-auto">
            
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
                <div className="mb-6 lg:mb-0">
                    <h1 className="text-4xl lg:text-4xl mt-5 font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent mb-4">
                        Loan Applications
                    </h1>
                    <p className="text-gray-600 text-lg">Submit your loan request to our lending platform</p>
                </div>
                <div className="absolute right-0 top-0">
                    {/* Wallet Connection Status */}
                    {!connection ? (
                        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
                            <h2 className="text-xl font-semibold mb-4 text-orange-600">Connect Wallet</h2>
                            <div className="flex flex-wrap gap-3">
                                {wallets.map((wallet) => (
                                    <button
                                        key={wallet.name}
                                        onClick={() => connectWallet(wallet)}
                                        disabled={isConnecting}
                                        className="group flex items-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50"
                                    >
                                        {wallet.icon && (
                                            <img src={wallet.icon} alt={wallet.name} className="w-5 h-5 mr-3 group-hover:animate-spin" />
                                        )}
                                        {isConnecting ? "Connecting..." : `Connect ${wallet.name}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="md:mb-2 md:px-3">
                            <div className="md:flex hidden items-center space-x-3 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-2xl">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <div>
                                    <p className="text-green-700 text-[13px] font-semibold">Wallet Connected</p>
                                    <p className="text-gray-600 text-[10px]">
                                        {connection.address.substring(0, 12)}...{connection.address.substring(connection.address.length - 12)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Credit Score Display */}
            {connection && (
                <div className="mb-8 bg-gradient-to-r w-[100%] from-grey-50/80 to-white-50/80 backdrop-blur-xl rounded-2xl p-4 md:p-6 shadow-2xl">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Credit Profile</h3>
                    {loadingCreditScore ? (
                        <div className="animate-pulse space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                                </div>
                            </div>
                        </div>
                    ) : creditScore ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-r ${
                                    creditScore.current_score >= 750 ? 'from-green-500 to-green-600' :
                                    creditScore.current_score >= 650 ? 'from-blue-500 to-blue-600' :
                                    creditScore.current_score >= 550 ? 'from-yellow-500 to-yellow-600' :
                                    'from-red-500 to-red-600'
                                }`}>
                                    {creditScore.current_score}
                                </div>
                                <div className="flex gap-3 flex-col">
                                    <div className="flex gap-2">
                                        <span className={`text-lg font-bold ${getCreditScoreColor(creditScore.current_score)}`}>
                                            {getCreditScoreLabel(creditScore.current_score)} :
                                        </span>
                                        <span className="text-gray-600 mt-1">
                                            {getRiskLevel(creditScore.current_score)}
                                        </span>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/40">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">
                                                Maximum Loan Amount : 
                                            </span>
                                            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                                                <span className="p-1"></span> {formatNaira(getMaxLoanAmountByCreditScore(creditScore.current_score))}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Based on your current credit score
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {creditScore.total_loans > 0 && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/40 text-center">
                                        <div className="text-2xl font-bold text-green-600">{creditScore.on_time_payments}</div>
                                        <div className="text-sm text-gray-600">On Time</div>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/40 text-center">
                                        <div className="text-2xl font-bold text-blue-600">{creditScore.early_payments}</div>
                                        <div className="text-sm text-gray-600">Early</div>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/40 text-center">
                                        <div className="text-2xl font-bold text-red-600">{creditScore.late_payments}</div>
                                        <div className="text-sm text-gray-600">Late</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <div className="text-gray-500">Unable to load credit score</div>
                        </div>
                    )}
                </div>
            )}

            {/* Status Messages */}
            {error && (
                <div className="mb-8 bg-gradient-to-r from-red-50/80 to-red-100/80 backdrop-blur-xl border border-red-200 rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}
            
            {requestId && (
                <div className="mb-8 bg-gradient-to-r from-green-50/80 to-emerald-100/80 backdrop-blur-xl border border-green-200 rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-green-700 font-semibold">Loan Request Submitted Successfully!</p>
                    </div>
                    <p className="text-gray-600 text-sm break-all">Request ID: {requestId}</p>
                </div>
            )}
            
            {/* Create Loan Request Form */}
            {connection && (
                <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                        <h2 className="text-3xl font-bold text-gray-800">Create Loan Request</h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Loan Amount (Naira)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₦</span>
                                <input
                                    type="number"
                                    value={loanAmountNaira}
                                    onChange={(e) => handleLoanAmountChange(Number(e.target.value))}
                                    className={`w-full pl-10 pr-4 py-4 bg-white/80 backdrop-blur-xl border ${
                                        inputError.loanAmount ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-orange-400'
                                    } rounded-xl transition-all duration-300 focus:ring-4 focus:ring-orange-100 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                    disabled={isSubmitting || loadingCreditScore}
                                    min="0"
                                    max={creditScore ? getMaxLoanAmountByCreditScore(creditScore.current_score) : 40000}
                                    step="1000"
                                />
                            </div>
                            <div className="space-y-1">
                                {creditScore && (
                                    <div className="text-sm text-blue-600">
                                        Max: {formatNaira(getMaxLoanAmountByCreditScore(creditScore.current_score))}
                                    </div>
                                )}
                                {inputError.loanAmount && (
                                    <div className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded-lg">
                                        {inputError.loanAmount}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Interest (Naira)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₦</span>
                                <input
                                    type="number"
                                    value={interestNaira}
                                    onChange={(e) => setInterestNaira(Number(e.target.value))}
                                    className="w-full pl-10 pr-4 py-4 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl transition-all duration-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    disabled={isSubmitting}
                                    min="0"
                                    step="1000"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Deadline (Days)
                            </label>
                            <input
                                type="number"
                                value={deadlineDays}
                                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                                className="w-full px-4 py-4 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl transition-all duration-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                disabled={isSubmitting}
                                min="1"
                                max="365"
                            />
                        </div>
                    </div>
                    
                    {/* Loan Summary */}
                    {creditScore && (
                        <div className="mb-8 bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                                Loan Summary
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/40">
                                        <div className="text-sm text-gray-600">Loan Amount</div>
                                        <div className="text-xl font-bold text-orange-600">{formatNaira(loanAmountNaira)}</div>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/40">
                                        <div className="text-sm text-gray-600">Interest</div>
                                        <div className="text-xl font-bold text-yellow-600">{formatNaira(interestNaira)}</div>
                                    </div>
                                </div>
                                
                                <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-white/40">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-medium text-gray-700">Total to Repay:</span>
                                        <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                                            {formatNaira(loanAmountNaira + interestNaira)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                                        <span>Interest Rate:</span>
                                        <span className="font-medium">{loanAmountNaira > 0 ? ((interestNaira / loanAmountNaira) * 100).toFixed(1) : 0}%</span>
                                    </div>
                                </div>
                                
                                {/* Loan Type and Fee Information */}
                                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/40">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-gray-600">Loan Type</div>
                                            <div className="font-semibold text-gray-800">
                                                {getLoanTypeName(Math.min(loanAmountNaira, getMaxLoanAmountByCreditScore(creditScore.current_score)))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Application Fee</div>
                                            <div className="font-semibold text-gray-800">
                                                {formatNaira(getLoanRequestFee(Math.min(loanAmountNaira, getMaxLoanAmountByCreditScore(creditScore.current_score))))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <button
                        onClick={createLoanRequest}
                        disabled={
                            isSubmitting || 
                            loadingCreditScore || 
                            !creditScore ||
                            (creditScore && loanAmountNaira > getMaxLoanAmountByCreditScore(creditScore.current_score))
                        }
                        className="w-full md:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Submitting...</span>
                            </div>
                        ) : loadingCreditScore ? "Loading credit score..." :
                         !creditScore ? "Credit score unavailable" :
                         (creditScore && loanAmountNaira > getMaxLoanAmountByCreditScore(creditScore.current_score)) ? 
                            "Amount exceeds credit limit" :
                         "Create Loan Request"}
                    </button>
                </div>
            )}
        </div>
    </div>
);
};

export default Applications;