import React, { useState, useEffect } from "react";

// Mock wallet connection hook
const useWallet = () => {
    const [connection, setConnection] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    
    const wallets = [
        { name: "Nami", icon: null },
        { name: "Eternl", icon: null },
        { name: "Flint", icon: null }
    ];
    
    const connectWallet = (wallet) => {
        setIsConnecting(true);
        setTimeout(() => {
            setConnection({
                address: "addr1qxy7ty8kjd3f3x3e9l5w8u4p2h8v9n3k5j7m2l9x4c6v8b0n9m7k5j3h1g9f8e7d6c5b4a3n2m1l0k9j8h7g6f5e4d3c2b1a0",
                pkh: "abc123def456"
            });
            setIsConnecting(false);
        }, 1000);
    };
    
    return { connection, wallets, connectWallet, isConnecting };
};

// Mock Credit Score Guide Component
const CreditScoreGuide = () => {
    return (
        <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-xl border border-blue-200 rounded-3xl p-8 shadow-lg">
            <div className="flex items-center space-x-4 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                <h3 className="text-2xl font-bold text-gray-800">Credit Score Guide</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/60 backdrop-blur-xl border border-green-200 rounded-xl p-4">
                    <div className="text-green-600 font-bold text-lg mb-2">Excellent (750+)</div>
                    <p className="text-sm text-gray-600">Best rates and terms available</p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-blue-200 rounded-xl p-4">
                    <div className="text-blue-600 font-bold text-lg mb-2">Good (650-749)</div>
                    <p className="text-sm text-gray-600">Favorable lending conditions</p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-yellow-200 rounded-xl p-4">
                    <div className="text-yellow-600 font-bold text-lg mb-2">Fair (550-649)</div>
                    <p className="text-sm text-gray-600">Standard rates apply</p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-red-200 rounded-xl p-4">
                    <div className="text-red-600 font-bold text-lg mb-2">Poor (&lt;550)</div>
                    <p className="text-sm text-gray-600">Limited options available</p>
                </div>
            </div>
        </div>
    );
};

const LoanToBeRepaid = () => {
    const { connection, wallets, connectWallet, isConnecting } = useWallet();
    const [showCreditScore, setShowCreditScore] = useState(false);
    const [loadingRepay, setLoadingRepay] = useState(null);
    const [txHash, setTxHash] = useState(null);
    const [error, setError] = useState(null);
    const [paymentFeedback, setPaymentFeedback] = useState(null);
    
    // Mock credit score data
    const creditScore = {
        current_score: 720,
        total_loans: 5,
        on_time_payments: 4,
        early_payments: 2,
        late_payments: 1
    };
    
    // Mock loans data
    const loansToRepay = [
        {
            fundedLoanId: "loan-001-tx123456",
            lenderPKH: "lender1abc2def3ghi4jkl5mno6pqr7stu8vwx9yz0",
            loanAmount: BigInt(50000000),
            interest: BigInt(5000000),
            deadline: BigInt(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            originalLoanId: "original-loan-123"
        },
        {
            fundedLoanId: "loan-002-tx789012",
            lenderPKH: "lender2xyz9abc8def7ghi6jkl5mno4pqr3stu2vwx1",
            loanAmount: BigInt(100000000),
            interest: BigInt(10000000),
            deadline: BigInt(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            originalLoanId: "original-loan-456"
        },
        {
            fundedLoanId: "loan-003-tx345678",
            lenderPKH: "lender3mno6pqr5stu4vwx3yz02abc1def0ghi9jkl8",
            loanAmount: BigInt(75000000),
            interest: BigInt(7500000),
            deadline: BigInt(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day overdue
            originalLoanId: "original-loan-789"
        }
    ];
    
    // Helper functions
    const lovelaceToAda = (lovelace) => {
        return (Number(lovelace) / 1_000_000).toFixed(6);
    };
    
    const formatDate = (timestamp) => {
        return new Date(Number(timestamp)).toLocaleString();
    };
    
    const daysRemaining = (deadline) => {
        const now = Date.now();
        const deadlineTime = Number(deadline);
        const diffMs = deadlineTime - now;
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    };
    
    const isDeadlineExpired = (deadline) => {
        return Number(deadline) < Date.now();
    };
    
    const getCreditScoreColor = (score) => {
        if (score >= 750) return 'text-green-600';
        if (score >= 650) return 'text-blue-600';
        if (score >= 550) return 'text-yellow-600';
        return 'text-red-600';
    };
    
    const getCreditScoreLabel = (score) => {
        if (score >= 750) return 'Excellent';
        if (score >= 650) return 'Good';
        if (score >= 550) return 'Fair';
        return 'Poor';
    };
    
    const repayLoan = (loan) => {
        setError(null);
        setTxHash(null);
        setPaymentFeedback(null);
        setLoadingRepay(loan.fundedLoanId);
        
        // Simulate transaction
        setTimeout(() => {
            const mockTxHash = "tx_" + Math.random().toString(36).substring(2, 15);
            setTxHash(mockTxHash);
            setPaymentFeedback({
                category: 'on_time',
                details: 'Good! Repaid with time to spare (+35 credit points)'
            });
            setLoadingRepay(null);
        }, 2000);
    };

    return (
        <div className="min-h-screen text-gray-900 relative overflow-hidden">

            {/* Animated Background Elements */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-20 left-20 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                <div className="absolute top-40 right-20 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
                <div className="absolute -bottom-8 left-40 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
            </div>

            <div className="relative z-10 p-4 pt-5 max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-2 md:mb-12">
                    <div className="mb-6 lg:mb-0">
                        <h1 className="text-4xl mt-3 md:mt-0 lg:text-5xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent mb-4">
                            Loans to Repay
                        </h1>
                        <p className="text-gray-600 text-lg">Manage your active loans and maintain your credit score</p>
                    </div>
                    <div className="absolute md:block right-0 top-0">
                        {/* Wallet Connection */}
                        {!connection ? (
                            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
                                <h2 className="text-xl font-semibold mb-4 text-orange-600">Connect Wallet</h2>
                                <div className="flex flex-wrap gap-3">
                                    {wallets.map((wallet) => (
                                        <button
                                            key={wallet.name}
                                            onClick={() => connectWallet(wallet)}
                                            className="group flex items-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                        >
                                            {wallet.icon && (
                                                <img src={wallet.icon} alt={wallet.name} className="w-5 h-5 mr-3 group-hover:animate-spin" />
                                            )}
                                            Connect {wallet.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gradient-to-r from-green-100 to-emerald-100 backdrop-blur-xl border border-green-200 rounded-2xl p-2 md:p-6 shadow-2xl">
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
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="mb-8 bg-gradient-to-r from-red-50 to-red-100 backdrop-blur-xl border border-red-200 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {txHash && (
                    <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-100 backdrop-blur-xl border border-green-200 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-green-700 font-semibold">Loan Successfully Repaid!</p>
                        </div>
                        <p className="text-gray-600 text-sm break-all mb-3">Hash: {txHash}</p>
                        
                        {/* Payment feedback */}
                        {paymentFeedback && (
                            <div className="mt-3 p-4 bg-white/60 backdrop-blur-xl rounded-xl border-l-4 border-green-400">
                                <div className="flex items-center">
                                    <span className={`inline-block w-3 h-3 rounded-full mr-3 ${
                                        paymentFeedback.category === 'early' ? 'bg-blue-500 animate-pulse' :
                                        paymentFeedback.category === 'on_time' ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'
                                    }`}></span>
                                    <span className="text-sm font-medium text-gray-700">
                                        Payment Impact: {paymentFeedback.details}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        {/* Credit score update */}
                        {creditScore && (
                            <div className="mt-3 p-3 bg-white/40 backdrop-blur-xl rounded-lg">
                                <span className="text-sm text-gray-600">Credit score updated to: </span>
                                <span className={`font-bold ml-1 ${getCreditScoreColor(creditScore.current_score)}`}>
                                    {creditScore.current_score}
                                </span>
                                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getCreditScoreColor(creditScore.current_score)} bg-white/20`}>
                                    {getCreditScoreLabel(creditScore.current_score)}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Credit Score Section */}
                {connection && (
                <div className="md:mb-8 mb-2  bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl md:p-8 p-4 shadow-lg">
                    {/* Header with Toggle Button */}
                    <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                        <h3 className="text-2xl font-bold text-gray-800">Credit Score</h3>
                    </div>
                    <button
                        onClick={() => setShowCreditScore(!showCreditScore)}
                        className="bg-gradient-to-r from-orange-600 to-orange-600 hover:from-orange-700 hover:to-orange-700 text-white md:px-4 px-2 py-2 rounded-xl transition-all duration-300 transform hover:scale-105"
                    >
                        {showCreditScore ? 'Hide Details' : 'Show Details'}
                    </button>
                    </div>

                    {/* Score Overview */}
                    <div className="flex items-center  px-2 gap-6 mb-4">
                    {creditScore ? (
                        <>
                        <div className="text-center">
                            <span
                            className={`text-4xl font-bold ${getCreditScoreColor(
                                creditScore.current_score
                            )}`}
                            >
                            {creditScore.current_score}
                            </span>
                        </div>
                        <div
                            className={`px-4 py-2 rounded-xl font-medium border ${
                            creditScore.current_score >= 750
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : creditScore.current_score >= 650
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : creditScore.current_score >= 550
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                        >
                            {getCreditScoreLabel(creditScore.current_score)}
                        </div>
                        </>
                    ) : (
                        <div className="animate-pulse flex items-center space-x-4">
                        <div className="h-12 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </div>
                    )}
                    </div>

                    {/* Details with Animation */}
                    <div
                    className={`transition-all duration-500 ease-in-out ${
                        showCreditScore && creditScore ? 'mb-6' : 'mb-0'
                    }`}
                    >
                    <div
                        className={`grid grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden transition-all duration-500 ease-in-out transform ${
                        showCreditScore && creditScore
                            ? 'opacity-100 max-h-96 scale-100'
                            : 'opacity-0 max-h-0 scale-95 pointer-events-none'
                        }`}
                        style={{
                        transitionProperty: 'opacity, transform, max-height, margin',
                        }}
                    >
                        {creditScore && (
                        <>
                            <div className="bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4 text-center">
                            <div className="text-sm font-semibold text-gray-600 mb-2">
                                Total Loans
                            </div>
                            <div className="text-2xl font-bold text-zinc-700">
                                {creditScore.total_loans}
                            </div>
                            </div>
                            <div className="bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4 text-center">
                            <div className="text-sm font-semibold text-gray-600 mb-2">
                                On Time
                            </div>
                            <div className="text-2xl font-bold text-green-600">
                                {creditScore.on_time_payments}
                            </div>
                            </div>
                            <div className="bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4 text-center">
                            <div className="text-sm font-semibold text-gray-600 mb-2">
                                Early
                            </div>
                            <div className="text-2xl font-bold text-zinc-700">
                                {creditScore.early_payments}
                            </div>
                            </div>
                            <div className="bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4 text-center">
                            <div className="text-sm font-semibold text-gray-600 mb-2">
                                Late
                            </div>
                            <div className="text-2xl font-bold text-red-600">
                                {creditScore.late_payments}
                            </div>
                            </div>
                        </>
                        )}
                    </div>
                    </div>
                </div>
                )}


                {/* Credit Score Guide */}
                {connection && <CreditScoreGuide />}

                {/* Main Content - Loans to Repay */}
                <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 -translate-y-10 md:-translate-y-55 shadow-2xl">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                        <h2 className="text-3xl font-bold text-gray-800">Your Active Loans</h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                    </div>

                    {!connection ? (
                        <div className="text-center py-16 bg-gray-100/60 rounded-2xl">
                            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                                <span className="text-3xl">🔗</span>
                            </div>
                            <p className="text-gray-700 text-xl">Connect your wallet to view loans</p>
                            <p className="text-gray-500 mt-2">Access your loan repayment dashboard</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {loansToRepay.map((loan, index) => {
                                const interest = loan.interest || BigInt(0);
                                const deadline = loan.deadline || BigInt(0);
                                const totalToRepay = loan.loanAmount + interest;
                                const isExpired = isDeadlineExpired(deadline);
                                const daysLeft = daysRemaining(deadline);
                                
                                return (
                                    <div 
                                        key={loan.fundedLoanId} 
                                        className={`group backdrop-blur-xl border rounded-2xl p-6 transition-all duration-500 transform hover:scale-[1.02] ${
                                            isExpired 
                                                ? 'bg-gradient-to-r from-red-50/80 to-red-100/80 border-red-300 hover:border-red-400 hover:shadow-2xl' 
                                                : 'bg-gradient-to-r from-white/80 to-gray-50/80 border-gray-200 hover:border-orange-300 hover:shadow-2xl'
                                        }`}
                                        style={{animationDelay: `${index * 100}ms`}}
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                            {/* Lender Info */}
                                            <div className="lg:col-span-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {loan.lenderPKH.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600 text-sm">Lender</p>
                                                        <p className="text-gray-800 font-mono text-sm">
                                                            {loan.lenderPKH.substring(0, 8)}...{loan.lenderPKH.substring(loan.lenderPKH.length - 8)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Loan Amount & Interest */}
                                            <div className="lg:col-span-4">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Loan Amount</p>
                                                        <p className="text-xl font-bold text-orange-600">
                                                            {lovelaceToAda(loan.loanAmount)} <span className="text-sm text-gray-500">ADA</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Interest</p>
                                                        <p className="text-lg font-semibold text-yellow-600">
                                                            {lovelaceToAda(interest)} <span className="text-sm text-gray-500">ADA</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Total to Repay</p>
                                                        <p className="text-xl font-bold text-purple-600">
                                                            {lovelaceToAda(totalToRepay)} <span className="text-sm text-gray-500">ADA</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Deadline Status */}
                                            <div className="lg:col-span-3">
                                                <div className="text-center">
                                                    <p className="text-gray-500 text-sm mb-1">Deadline</p>
                                                    <p className="text-gray-800 text-sm mb-2">{formatDate(deadline)}</p>
                                                    {isExpired ? (
                                                        <div className="flex items-center justify-center space-x-2">
                                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                            <span className="text-red-600 font-bold text-sm">OVERDUE!</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center space-x-2">
                                                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                                                                daysLeft <= 3 ? 'bg-red-500' : daysLeft <= 7 ? 'bg-yellow-500' : 'bg-green-500'
                                                            }`}></div>
                                                            <span className={`font-medium text-sm ${
                                                                daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-yellow-600' : 'text-green-600'
                                                            }`}>
                                                                {daysLeft} days remaining
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Repay Action */}
                                            <div className="lg:col-span-2">
                                                <button
                                                    onClick={() => repayLoan(loan)}
                                                    disabled={loadingRepay === loan.fundedLoanId}
                                                    className={`w-full px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                                                        isExpired 
                                                            ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white' 
                                                            : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white'
                                                    }`}
                                                >
                                                    {loadingRepay === loan.fundedLoanId ? (
                                                        <div className="flex items-center justify-center space-x-2">
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            <span>Processing...</span>
                                                        </div>
                                                    ) : (
                                                        isExpired ? "Repay Overdue Loan" : "Repay Loan"
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Loan ID */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-gray-400 font-mono">
                                                    ID: {loan.fundedLoanId.substring(0, 16)}...
                                                </p>
                                                {loan.originalLoanId && (
                                                    <p className="text-xs text-gray-400 font-mono">
                                                        From: {loan.originalLoanId.substring(0, 8)}...
                                                    </p>
                                                )}
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

export default LoanToBeRepaid;