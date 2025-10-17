import React, { useState, useEffect } from "react";
import { Address, validatorToAddress, SpendingValidator } from "@lucid-evolution/lucid";
import { useWallet } from "./Dashboard";

type CreditScoreData = {
    current_score: number;
    total_loans: number;
    on_time_payments: number;
    early_payments: number;
    late_payments: number;
};
// Define the API URL
const API_URL = "https://swiftfund-6b61.onrender.com/api/loans";

type RepaidLoan = {
    id: string;           // Unique ID for the repaid loan (fundedLoanId)
    data: {
        repaidAt: number; // Timestamp when the loan was repaid
        repaymentTxHash: string; // Transaction hash of the repayment
        loanAmount: string; // Original loan amount (as string)
        interest: string; // Interest amount (as string)
        originalLoanId?: string; // Reference to the original loan request UTXO ID
        lenderPKH: string; // Payment key hash of the lender
        borrowerPKH: string; // Payment key hash of the borrower
        deadline: string; // Loan deadline timestamp
        fundedAt: number; // When the loan was funded
        paymentCategory?: string; // 'early', 'on_time', or 'late'
        daysEarlyLate?: number; // Number of days early (negative) or late (positive)
    };
};

const LoansIRepaid: React.FC = () => {
    const { wallets, connection, isConnecting, connectWallet } = useWallet();
    const [repaidLoans, setRepaidLoans] = useState<RepaidLoan[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [creditScore, setCreditScore] = useState<CreditScoreData | null>(null);
    const [showCreditScore, setShowCreditScore] = useState<boolean>(false);

    // Function to load repayments from the API
    async function loadRepaymentHistory(userPkh: string): Promise<void> {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await fetch(`${API_URL}/borrower/${userPkh}/repaid`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                setRepaidLoans(data.repaidLoans);
                
                if (data.repaidLoans.length === 0) {
                    console.log("No repaid loans found for this user");
                }
            } else {
                console.error("API error:", data.message);
                setError(`Failed to load repayment history: ${data.message}`);
            }
        } catch (error) {
            console.error("Error loading repayment history:", error);
            setError("Failed to load repayment history. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchCreditScore(userPKH: string): Promise<void> {
        try {
            const response = await fetch(`${API_URL}/credit-score/${userPKH}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                setCreditScore(data.creditScore);
            } else {
                console.error("Error fetching credit score:", data.message);
            }
        } catch (error) {
            console.error("Error fetching credit score:", error);
        }
    }
    
    // Load repayment history when a wallet is connected
    useEffect(() => {
        if (connection && connection.pkh) {
            loadRepaymentHistory(connection.pkh);
            fetchCreditScore(connection.pkh);
        }
    }, [connection]);
    
    // Handle wallet connection
    const handleConnectWallet = async (wallet: any) => {
        try {
            setError(null);
            await connectWallet(wallet);
        } catch (error) {
            console.error("Error connecting wallet:", error);
            setError("Failed to connect wallet. Please try again.");
        }
    };
    
    // Format lovelace to ADA
    function lovelaceToAda(lovelace: string): string {
        return (Number(lovelace) / 1_000_000).toFixed(6);
    }
    
    // Format date
    function formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleString();
    }
    
    // Function to copy text to clipboard
    function copyToClipboard(text: string): void {
        navigator.clipboard.writeText(text)
            .then(() => {
                alert("Transaction hash copied to clipboard!");
            })
            .catch((err) => {
                console.error("Failed to copy text: ", err);
            });
    }

    function getCreditScoreColor(score: number): string {
        if (score >= 750) return 'text-green-600';
        if (score >= 650) return 'text-blue-600';
        if (score >= 550) return 'text-yellow-600';
        return 'text-red-600';
    }

    // Function to get credit score label
    function getCreditScoreLabel(score: number): string {
        if (score >= 750) return 'Excellent';
        if (score >= 650) return 'Good';
        if (score >= 550) return 'Fair';
        return 'Poor';
    }

    // Function to get payment timing display
    function getPaymentTimingDisplay(paymentCategory?: string, daysEarlyLate?: number) {
        if (!paymentCategory) {
            return <span className="text-gray-400">N/A</span>;
        }

        const days = Math.abs(daysEarlyLate || 0);
        const daysText = days === 1 ? 'day' : 'days';

        switch (paymentCategory) {
            case 'early':
                return (
                    <div className="flex items-center">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-green-700 font-medium">Early</span>
                        {days > 0 && (
                            <span className="text-green-600 text-xs ml-1">
                                ({days} {daysText})
                            </span>
                        )}
                    </div>
                );
            case 'on_time':
                return (
                    <div className="flex items-center">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        <span className="text-blue-700 font-medium">On Time</span>
                    </div>
                );
            case 'late':
                return (
                    <div className="flex items-center">
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        <span className="text-red-700 font-medium">Late</span>
                        {days > 0 && (
                            <span className="text-red-600 text-xs ml-1">
                                ({days} {daysText})
                            </span>
                        )}
                    </div>
                );
            default:
                return <span className="text-gray-400">Unknown</span>;
        }
    }
return (
    <div className="min-h-screen mt-3 text-gray-900 relative overflow-hidden">

        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute -bottom-8 left-40 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative z-10 p-4 pt-5 max-w-6xl mx-auto">

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
                <div className="mb-6 lg:mb-0">
                    <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent mb-4">
                        Loans I Have Repaid
                    </h1>
                    <p className="text-gray-600 text-lg">Track your loan repayment history and build your credit score in the decentralized ecosystem</p>
                </div>

                {/* Wallet Connection */}
                {!connection ? (
                    <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-xl font-semibold mb-4 text-orange-600">Connect Wallet</h2>
                        <div className="flex flex-wrap gap-3">
                            {wallets.map((wallet) => (
                                <button
                                    key={wallet.name}
                                    onClick={() => handleConnectWallet(wallet)}
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
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 backdrop-blur-xl border border-green-200 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <div>
                                <p className="text-green-700 font-semibold">Wallet Connected</p>
                                <p className="text-gray-600 text-sm">
                                    {connection.address.substring(0, 12)}...{connection.address.substring(connection.address.length - 12)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-8 bg-gradient-to-r from-red-50 to-red-100 backdrop-blur-xl border border-red-200 rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Credit Score Section */}
            {connection && (
                <div className="mb-8 bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                        <h3 className="text-3xl font-bold text-gray-800">Credit Score Dashboard</h3>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            {creditScore ? (
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <span className={`text-5xl font-bold ${getCreditScoreColor(creditScore.current_score)}`}>
                                            {creditScore.current_score}
                                        </span>
                                        <div className={`mt-2 px-4 py-2 rounded-xl text-lg font-semibold ${getCreditScoreColor(creditScore.current_score)} bg-opacity-10 border border-current border-opacity-20`}>
                                            {getCreditScoreLabel(creditScore.current_score)}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-pulse">
                                    <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowCreditScore(!showCreditScore)}
                            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                            {showCreditScore ? 'Hide Details' : 'Show Details'}
                        </button>
                    </div>
                    
                    {showCreditScore && creditScore && (
                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center p-6 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl">
                                <div className="font-semibold text-gray-600 mb-2">Total Loans</div>
                                <div className="text-3xl font-bold text-orange-600">{creditScore.total_loans}</div>
                            </div>
                            <div className="text-center p-6 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl">
                                <div className="font-semibold text-gray-600 mb-2">On Time</div>
                                <div className="text-3xl font-bold text-green-600">{creditScore.on_time_payments}</div>
                            </div>
                            <div className="text-center p-6 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl">
                                <div className="font-semibold text-gray-600 mb-2">Early</div>
                                <div className="text-3xl font-bold text-blue-600">{creditScore.early_payments}</div>
                            </div>
                            <div className="text-center p-6 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl">
                                <div className="font-semibold text-gray-600 mb-2">Late</div>
                                <div className="text-3xl font-bold text-red-600">{creditScore.late_payments}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Repaid Loans List */}
            <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center space-x-4 mb-8">
                    <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                    <h2 className="text-3xl font-bold text-gray-800">Your Repaid Loans</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                </div>
                
                {isLoading ? (
                    <div className="text-center py-16">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-400 rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2" style={{animationDirection: 'reverse'}}></div>
                        </div>
                        <p className="text-gray-600 text-lg">Loading your repaid loans...</p>
                    </div>
                ) : repaidLoans.length === 0 ? (
                    <div className="text-center py-16 bg-gray-100/60 rounded-2xl">
                        <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                            <span className="text-3xl">✅</span>
                        </div>
                        <p className="text-gray-700 text-xl">No repaid loans found</p>
                        <p className="text-gray-500 mt-2">Your repayment history will appear here once you repay loans</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {repaidLoans.map((repayment, index) => {
                            const loanAmount = repayment.data.loanAmount;
                            const interest = repayment.data.interest;
                            const totalRepaid = (Number(loanAmount) + Number(interest)).toString();
                            
                            return (
                                <div 
                                    key={repayment.id} 
                                    className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 hover:border-orange-300 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]"
                                    style={{animationDelay: `${index * 100}ms`}}
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                        {/* Repayment Date */}
                                        <div className="lg:col-span-3">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white">
                                                    <span className="text-lg">✓</span>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600 text-sm">Repaid On</p>
                                                    <p className="text-gray-800 font-medium text-sm">
                                                        {formatDate(repayment.data.repaidAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment Status */}
                                        <div className="lg:col-span-2">
                                            <div className="p-4 rounded-xl border border-gray-200 bg-white/60">
                                                <div className="text-center">
                                                    {getPaymentTimingDisplay(repayment.data.paymentCategory, repayment.data.daysEarlyLate)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Loan Details */}
                                        <div className="lg:col-span-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-gray-500 text-sm mb-1">Loan Amount</p>
                                                    <p className="text-lg font-bold text-orange-600">
                                                        {lovelaceToAda(loanAmount)} <span className="text-xs text-gray-500">ADA</span>
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-sm mb-1">Interest</p>
                                                    <p className="text-lg font-semibold text-yellow-600">
                                                        {lovelaceToAda(interest)} <span className="text-xs text-gray-500">ADA</span>
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-sm mb-1">Total Repaid</p>
                                                    <p className="text-lg font-bold text-green-600">
                                                        {lovelaceToAda(totalRepaid)} <span className="text-xs text-gray-500">ADA</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Lender & Transaction */}
                                        <div className="lg:col-span-3">
                                            <div className="text-right">
                                                <p className="text-gray-500 text-sm mb-1">Lender</p>
                                                <p className="text-gray-800 text-sm font-mono mb-2">
                                                    {repayment.data.lenderPKH.substring(0, 8)}...{repayment.data.lenderPKH.substring(repayment.data.lenderPKH.length - 8)}
                                                </p>
                                                
                                                <a 
                                                    href={`https://preprod.cardanoscan.io/transaction/${repayment.data.repaymentTxHash}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm"
                                                >
                                                    <span>View Transaction</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Loan ID (smaller text at bottom) */}
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                                            <span>Loan ID: {repayment.id.substring(0, 16)}...</span>
                                            {repayment.data.originalLoanId && (
                                                <span>Original: {repayment.data.originalLoanId.substring(0, 16)}...</span>
                                            )}
                                            <span>TX: {repayment.data.repaymentTxHash.substring(0, 8)}...</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    </div>
);
};

export default LoansIRepaid;