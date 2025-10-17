import React, { useState, useEffect } from "react";

const API_URL = "https://swiftfund-6b61.onrender.com/api/loans";

type LoanRequest = {
    txId: string;
    outputIndex: number;
    borrowerPKH: string;
    loanAmount: bigint;
    interest: bigint; 
    deadline: bigint;
    uniqueId: string;
};

type CreditScoreData = {
    current_score: number;
    total_loans: number;
    on_time_payments: number;
    early_payments: number;
    late_payments: number;
};

// Mock wallet data
const mockWallets = [
    { name: "Nami", icon: "https://namiwallet.io/icon-128.png" },
    { name: "Eternl", icon: "https://eternl.io/favicon.ico" },
    { name: "Flint", icon: "https://flint-wallet.com/favicon.ico" }
];

// Utility function for API calls
async function apiCall(endpoint: string, method: string, data?: any) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API error: ${error}`);
        throw error;
    }
}

const FundLoan: React.FC = () => {
    const [connection, setConnection] = useState<any>(null);
    const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingFund, setLoadingFund] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [creditScores, setCreditScores] = useState<Map<string, CreditScoreData>>(new Map());
    
    // Mock wallet connection
    const connectWallet = (wallet: any) => {
        // Simulate wallet connection
        const mockConnection = {
            address: "addr_test1qz" + Math.random().toString(36).substring(2, 50),
            pkh: Math.random().toString(36).substring(2, 30)
        };
        setConnection(mockConnection);
    };

    // Fetch loan data when connection changes
    useEffect(() => {
        if (connection) {
            fetchLoanData();
        }
    }, [connection]);

    // Create a unique identifier for a specific UTxO
    function createUtxoId(txId: string, outputIndex: number): string {
        return `${txId}-${outputIndex}`;
    }

    async function fetchLoanData(): Promise<void> {
        try {
            setIsLoading(true);
            
            // Mock loan requests data
            const mockLoans: LoanRequest[] = [
                {
                    txId: "tx1" + Math.random().toString(36).substring(2, 30),
                    outputIndex: 0,
                    borrowerPKH: "borrower" + Math.random().toString(36).substring(2, 20),
                    loanAmount: BigInt(5000000000),
                    interest: BigInt(500000000),
                    deadline: BigInt(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    uniqueId: "loan1"
                },
                {
                    txId: "tx2" + Math.random().toString(36).substring(2, 30),
                    outputIndex: 0,
                    borrowerPKH: "borrower" + Math.random().toString(36).substring(2, 20),
                    loanAmount: BigInt(10000000000),
                    interest: BigInt(1000000000),
                    deadline: BigInt(Date.now() + 45 * 24 * 60 * 60 * 1000),
                    uniqueId: "loan2"
                },
                {
                    txId: "tx3" + Math.random().toString(36).substring(2, 30),
                    outputIndex: 0,
                    borrowerPKH: "borrower" + Math.random().toString(36).substring(2, 20),
                    loanAmount: BigInt(3000000000),
                    interest: BigInt(300000000),
                    deadline: BigInt(Date.now() + 60 * 24 * 60 * 60 * 1000),
                    uniqueId: "loan3"
                }
            ];

            setLoanRequests(mockLoans);

            // Mock credit scores
            const mockCreditScores = new Map<string, CreditScoreData>();
            mockLoans.forEach(loan => {
                mockCreditScores.set(loan.borrowerPKH, {
                    current_score: Math.floor(Math.random() * 300) + 500,
                    total_loans: Math.floor(Math.random() * 10) + 1,
                    on_time_payments: Math.floor(Math.random() * 8),
                    early_payments: Math.floor(Math.random() * 3),
                    late_payments: Math.floor(Math.random() * 2)
                });
            });
            
            setCreditScores(mockCreditScores);

        } catch (error) {
            console.error("Error fetching loan data:", error);
            setError("Failed to fetch loan data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    // Fund loan function (mock)
    async function fundLoan(loanRequest: LoanRequest): Promise<void> {
        if (!connection) {
            setError("Please connect your wallet first");
            return;
        }

        try {
            setError(null);
            setTxHash(null);
            
            if (connection.pkh === loanRequest.borrowerPKH) {
                setError("You cannot fund your own loan request");
                return;
            }

            setLoadingFund(loanRequest.txId);
            
            // Simulate transaction processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const mockTxHash = "tx_" + Math.random().toString(36).substring(2, 30);
            console.log("Loan funded successfully. Transaction hash:", mockTxHash);
            setTxHash(mockTxHash);
            
            // Wait for a moment and then refresh the loan data
            setTimeout(() => {
                fetchLoanData();
            }, 2000);
            
        } catch (error) {
            console.error("Error funding loan:", error);
            setError(`Failed to fund loan: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoadingFund(null);
        }
    }
    
    // Format date
    function formatDate(timestamp: bigint): string {
        return new Date(Number(timestamp)).toLocaleString();
    }
    
    // Format lovelace to ADA
    function lovelaceToAda(lovelace: bigint): string {
        return (Number(lovelace) / 1_000_000).toFixed(6);
    }
    
    // Calculate days remaining until deadline
    function daysRemaining(deadline: bigint): number {
        const now = Date.now();
        const deadlineTime = Number(deadline);
        const diffMs = deadlineTime - now;
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    function getCreditScoreColor(score: number): string {
        if (score >= 750) return 'text-green-600';
        if (score >= 650) return 'text-blue-600';
        if (score >= 550) return 'text-yellow-600';
        return 'text-red-600';
    }

    function getCreditScoreLabel(score: number): string {
        if (score >= 750) return 'Excellent';
        if (score >= 650) return 'Good';
        if (score >= 550) return 'Fair';
        return 'Poor';
    }

    const getCreditScoreBg = (score: number): string => {
        if (score >= 750) return 'bg-green-50 border-green-200';
        if (score >= 650) return 'bg-blue-50 border-blue-200';
        if (score >= 550) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    return (
        <div className="min-h-screen mt-3 text-gray-900 relative overflow-hidden">

            {/* Animated Background Elements */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-20 left-20 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                <div className="absolute top-40 right-20 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
                <div className="absolute -bottom-8 left-40 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
            </div>

            <div className="relative z-10 p-4 pt-5 max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
                    <div className="mb-6 lg:mb-0">
                        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent mb-4">
                            Fund Loans
                        </h1>
                        <p className="text-gray-600 text-lg">Discover and fund promising loan opportunities in the decentralized ecosystem</p>
                    </div>

                    {/* Wallet Connection */}
                    {!connection ? (
                        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
                            <h2 className="text-xl font-semibold mb-4 text-orange-600">Connect Wallet</h2>
                            <div className="flex flex-wrap gap-3">
                                {mockWallets.map((wallet) => (
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
                            <p className="text-green-700 font-semibold">Loan Funded Successfully!</p>
                        </div>
                        <p className="text-gray-600 text-sm break-all">Hash: {txHash}</p>
                    </div>
                )}

                {/* Main Content */}
                <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                        <h2 className="text-3xl font-bold text-gray-800">Active Loan Requests</h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-16">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                                <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-400 rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2" style={{animationDirection: 'reverse'}}></div>
                            </div>
                            <p className="text-gray-600 text-lg">Scanning blockchain for loan requests...</p>
                        </div>
                    ) : loanRequests.length === 0 ? (
                        <div className="text-center py-16 bg-gray-100/60 rounded-2xl">
                            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                                <span className="text-3xl">💰</span>
                            </div>
                            <p className="text-gray-700 text-xl">No active loan requests found</p>
                            <p className="text-gray-500 mt-2">Check back later for new opportunities</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {loanRequests.map((loan, index) => {
                                const creditScore = creditScores.get(loan.borrowerPKH);
                                const isOwnLoan = connection && loan.borrowerPKH === connection.pkh;
                                
                                return (
                                    <div 
                                        key={loan.uniqueId} 
                                        className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 hover:border-orange-300 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]"
                                        style={{animationDelay: `${index * 100}ms`}}
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                            {/* Borrower Info */}
                                            <div className="lg:col-span-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {loan.borrowerPKH.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600 text-sm">Borrower</p>
                                                        <p className="text-gray-800 font-mono text-sm">
                                                            {loan.borrowerPKH.substring(0, 8)}...{loan.borrowerPKH.substring(loan.borrowerPKH.length - 8)}
                                                        </p>
                                                        {isOwnLoan && (
                                                            <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                                                                Your Request
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Credit Score */}
                                            <div className="lg:col-span-2">
                                                {creditScore ? (
                                                    <div className={`p-4 rounded-xl border ${getCreditScoreBg(creditScore.current_score)}`}>
                                                        <div className="text-center">
                                                            <div className={`text-2xl font-bold ${getCreditScoreColor(creditScore.current_score)} mb-1`}>
                                                                {creditScore.current_score}
                                                            </div>
                                                            <div className={`text-xs font-medium ${getCreditScoreColor(creditScore.current_score)}`}>
                                                                {getCreditScoreLabel(creditScore.current_score)}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {creditScore.total_loans} loans
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="animate-pulse bg-gray-200 rounded-xl p-4">
                                                        <div className="h-6 bg-gray-300 rounded mb-2"></div>
                                                        <div className="h-4 bg-gray-300 rounded"></div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Loan Details */}
                                            <div className="lg:col-span-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Loan Amount</p>
                                                        <p className="text-2xl font-bold text-orange-600">
                                                            {lovelaceToAda(loan.loanAmount)} <span className="text-sm text-gray-500">ADA</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Interest</p>
                                                        <p className="text-xl font-semibold text-yellow-600">
                                                            {lovelaceToAda(loan.interest)} <span className="text-sm text-gray-500">ADA</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Deadline & Action */}
                                            <div className="lg:col-span-3">
                                                <div className="text-right">
                                                    <p className="text-gray-500 text-sm mb-1">Deadline</p>
                                                    <p className="text-gray-800 text-sm mb-1">{formatDate(loan.deadline)}</p>
                                                    <p className="text-green-600 text-sm font-medium mb-4">
                                                        {daysRemaining(loan.deadline)} days remaining
                                                    </p>
                                                    
                                                    {isOwnLoan ? (
                                                        <button
                                                            disabled
                                                            className="w-full bg-gray-200 text-gray-500 px-6 py-3 rounded-xl cursor-not-allowed border border-gray-300"
                                                        >
                                                            Cannot Fund Own Loan
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => fundLoan(loan)}
                                                            disabled={!connection || loadingFund === loan.txId}
                                                            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {loadingFund === loan.txId ? (
                                                                <div className="flex items-center justify-center space-x-2">
                                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                    <span>Processing...</span>
                                                                </div>
                                                            ) : (
                                                                "Fund Loan"
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Loan ID (smaller text at bottom) */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-xs text-gray-400 font-mono">
                                                ID: {loan.uniqueId.substring(0, 16)}...
                                            </p>
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

export default FundLoan;