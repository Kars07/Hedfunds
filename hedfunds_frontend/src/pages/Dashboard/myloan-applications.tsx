import React, { useState, useEffect } from "react";
import { useWallet } from "./Dashboard";
import { ethers } from "ethers";

// Contract address - replace with your deployed contract address
const LOAN_CONTRACT_ADDRESS = "0xYourContractAddressHere";

// Contract ABI for the functions we need
const LOAN_CONTRACT_ABI = [
    "function loanCounter() view returns (uint256)",
    "function loans(uint256) view returns (address borrower, address lender, uint256 loanAmount, uint256 interest, uint256 deadline, uint8 status, uint256 createdAt)",
    "function getLoan(uint256 _loanId) view returns (tuple(address borrower, address lender, uint256 loanAmount, uint256 interest, uint256 deadline, uint8 status, uint256 createdAt))",
    "function isLoanActive(uint256 _loanId) view returns (bool)",
    "function calculateDebt(uint256 _loanId) view returns (uint256)"
];

// Loan status enum matching the smart contract
enum LoanStatus {
    REQUESTED = 0,
    FUNDED = 1,
    REPAID = 2,
    DEFAULTED = 3
}

type LoanData = {
    loanId: number;
    borrower: string;
    lender: string;
    loanAmount: bigint;
    interest: bigint;
    deadline: bigint;
    status: LoanStatus;
    createdAt: bigint;
    statusLabel: "active" | "funded" | "repaid" | "defaulted" | "expired";
};

const MyLoanApplications: React.FC = () => {
    const { connection } = useWallet();
    const [myLoanRequests, setMyLoanRequests] = useState<LoanData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (connection) {
            fetchMyLoanRequests();
        }
    }, [connection]);

    async function fetchMyLoanRequests(): Promise<void> {
        try {
            setIsLoading(true);
            setError(null);

            if (!connection || !connection.address) {
                setError("Wallet not connected");
                return;
            }

            // Create provider and contract instance
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(
                LOAN_CONTRACT_ADDRESS,
                LOAN_CONTRACT_ABI,
                provider
            );

            // Get total number of loans
            const loanCounter = await contract.loanCounter();
            const totalLoans = Number(loanCounter);

            console.log("Total loans:", totalLoans);

            const loans: LoanData[] = [];
            const userAddress = connection.address.toLowerCase();
            const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

            // Fetch all loans and filter by user's address
            for (let i = 1; i <= totalLoans; i++) {
                try {
                    const loan = await contract.getLoan(i);
                    
                    // Check if this loan belongs to the current user
                    if (loan.borrower.toLowerCase() === userAddress) {
                        // Determine display status
                        let statusLabel: "active" | "funded" | "repaid" | "defaulted" | "expired";
                        
                        if (loan.status === LoanStatus.REQUESTED) {
                            // Check if loan is expired
                            if (Number(loan.deadline) < currentTime) {
                                statusLabel = "expired";
                            } else {
                                statusLabel = "active";
                            }
                        } else if (loan.status === LoanStatus.FUNDED) {
                            statusLabel = "funded";
                        } else if (loan.status === LoanStatus.REPAID) {
                            statusLabel = "repaid";
                        } else if (loan.status === LoanStatus.DEFAULTED) {
                            statusLabel = "defaulted";
                        } else {
                            statusLabel = "active";
                        }

                        loans.push({
                            loanId: i,
                            borrower: loan.borrower,
                            lender: loan.lender,
                            loanAmount: loan.loanAmount,
                            interest: loan.interest,
                            deadline: loan.deadline,
                            status: loan.status,
                            createdAt: loan.createdAt,
                            statusLabel
                        });
                    }
                } catch (err) {
                    console.error(`Error fetching loan ${i}:`, err);
                }
            }

            // Sort loans: active first, then funded, then repaid, then expired, then defaulted
            loans.sort((a, b) => {
                const statusOrder = { 
                    active: 0, 
                    funded: 1, 
                    repaid: 2, 
                    expired: 3,
                    defaulted: 4 
                };
                const statusDiff = statusOrder[a.statusLabel] - statusOrder[b.statusLabel];
                if (statusDiff !== 0) return statusDiff;
                
                // If same status, sort by deadline (most urgent first)
                return Number(a.deadline) - Number(b.deadline);
            });

            setMyLoanRequests(loans);
        } catch (error) {
            console.error("Error fetching loan requests:", error);
            setError("Failed to fetch your loan requests. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    function refreshLoanData(): void {
        if (connection) {
            fetchMyLoanRequests();
        }
    }

    function formatDate(timestamp: bigint): string {
        return new Date(Number(timestamp) * 1000).toLocaleString();
    }

    function weiToHbar(wei: bigint): string {
        return ethers.formatEther(wei);
    }

    function getDaysRemaining(deadline: bigint): number {
        const now = Math.floor(Date.now() / 1000);
        const deadlineTime = Number(deadline);
        const diffSeconds = deadlineTime - now;
        return Math.max(0, Math.ceil(diffSeconds / (60 * 60 * 24)));
    }

    function getStatusBadge(status: "active" | "funded" | "repaid" | "defaulted" | "expired"): { text: string, className: string } {
        switch (status) {
            case "active":
                return { 
                    text: "Active", 
                    className: "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium" 
                };
            case "funded":
                return { 
                    text: "Funded", 
                    className: "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium" 
                };
            case "repaid":
                return { 
                    text: "Repaid", 
                    className: "bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium" 
                };
            case "defaulted":
                return { 
                    text: "Defaulted", 
                    className: "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium" 
                };
            case "expired":
                return { 
                    text: "Expired", 
                    className: "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium" 
                };
        }
    }

    function getStatusEmoji(status: "active" | "funded" | "repaid" | "defaulted" | "expired"): string {
        switch (status) {
            case "active": return "🟢";
            case "funded": return "💰";
            case "repaid": return "✅";
            case "defaulted": return "⚠️";
            case "expired": return "⏰";
        }
    }

    return (
        <div className="min-h-screen text-gray-900 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-20 left-20 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                <div className="absolute top-40 right-20 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
                <div className="absolute -bottom-8 left-40 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
            </div>

            <div className="relative z-10 p-4 pt-5 pl-9 max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
                    <div className="mb-6 lg:mb-0">
                        <h1 className="text-4xl mt-3 md:mt-0 lg:text-4xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent mb-4">
                            My Loan Applications
                        </h1>
                        <p className="text-gray-600 text-lg">Track and manage your decentralized loan requests on Hedera</p>
                    </div>
                    <div className="absolute md:block right-0 top-0">
                        {/* Wallet Status */}
                        {!connection ? (
                            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
                                <h2 className="text-xl font-semibold mb-4 text-orange-600">Wallet connection required</h2>
                                <p className="text-gray-600">Please connect your wallet from the sidebar to view your loan applications.</p>
                            </div>
                        ) : (
                            <div className="bg-orange-50 border border-orange-200 rounded-2xl md:p-4 p-2 shadow-2xl">
                                <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 bg-green-500 mb-6 rounded-full animate-pulse"></div>
                                    <div>
                                        <p className="text-green-600 text-[13px] font-semibold">Wallet Connected</p>
                                        <p className="text-gray-600 text-[11px]">
                                            {connection.address.substring(0, 12)}...{connection.address.substring(connection.address.length - 12)}
                                        </p>
                                        <div className="mt-2">
                                            <button 
                                                onClick={refreshLoanData}
                                                className="text-green-600 hover:text-green-700 cursor-pointer text-sm font-medium flex items-center"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                Refresh Loan Data
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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
                
                {/* My Loan Requests List */}
                <div className="bg-white/60 -translate-y-10 lg:translate-y-0 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl mb-10">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                        <h2 className="text-3xl font-bold text-gray-800">Your Loan Requests</h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                    </div>
                    
                    {isLoading ? (
                        <div className="text-center py-16">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                                <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-400 rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2" style={{animationDirection: 'reverse'}}></div>
                            </div>
                            <p className="text-gray-600 text-lg">Loading your loan requests...</p>
                        </div>
                    ) : !connection ? (
                        <div className="text-center py-16 bg-gray-100/60 rounded-2xl">
                            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                                <span className="text-3xl">🔗</span>
                            </div>
                            <p className="text-gray-700 text-xl">Connect your wallet to view your loan requests</p>
                            <p className="text-gray-500 mt-2">Your decentralized loan portfolio awaits</p>
                        </div>
                    ) : myLoanRequests.length === 0 ? (
                        <div className="text-center py-16 bg-gray-100/60 rounded-2xl">
                            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                                <span className="text-3xl">📋</span>
                            </div>
                            <p className="text-gray-700 text-xl">You haven't made any loan requests yet</p>
                            <p className="text-gray-500 mt-2">Start your DeFi journey by creating your first loan request</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {myLoanRequests.map((loan, index) => {
                                const statusBadge = getStatusBadge(loan.statusLabel);
                                const daysRemaining = getDaysRemaining(loan.deadline);
                                
                                return (
                                    <div 
                                        key={loan.loanId} 
                                        className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 hover:border-orange-300 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]"
                                        style={{animationDelay: `${index * 100}ms`}}
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                            {/* Status & ID */}
                                            <div className="lg:col-span-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {getStatusEmoji(loan.statusLabel)}
                                                    </div>
                                                    <div>
                                                        <div className="mb-2">
                                                            <span className={statusBadge.className}>
                                                                {statusBadge.text}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-600 text-xs">Loan ID</p>
                                                        <p className="text-gray-800 font-mono text-xs">
                                                            #{loan.loanId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Loan Amount & Interest */}
                                            <div className="lg:col-span-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Loan Amount</p>
                                                        <p className="text-2xl font-bold text-orange-600">
                                                            {weiToHbar(loan.loanAmount)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Interest</p>
                                                        <p className="text-xl font-semibold text-yellow-600">
                                                            {weiToHbar(loan.interest)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Deadline */}
                                            <div className="lg:col-span-3">
                                                <div>
                                                    <p className="text-gray-500 text-sm mb-1">Deadline</p>
                                                    <p className="text-gray-800 text-sm mb-1">{formatDate(loan.deadline)}</p>
                                                    {loan.statusLabel === "expired" ? (
                                                        <span className="text-red-600 text-sm font-medium">Expired</span>
                                                    ) : loan.statusLabel === "repaid" ? (
                                                        <span className="text-purple-600 text-sm font-medium">Completed</span>
                                                    ) : loan.statusLabel === "defaulted" ? (
                                                        <span className="text-gray-600 text-sm font-medium">Defaulted</span>
                                                    ) : (
                                                        <span className={`text-sm font-medium ${daysRemaining <= 1 ? "text-red-600" : "text-green-600"}`}>
                                                            {daysRemaining} days remaining
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* View on HashScan */}
                                            <div className="lg:col-span-2">
                                                <div className="text-right">
                                                    <p className="text-gray-500 text-sm mb-2">Contract</p>
                                                    <a 
                                                        href={`https://hashscan.io/testnet/contract/${LOAN_CONTRACT_ADDRESS}`}
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-4 py-2 rounded-xl text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                        HashScan
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                
                {/* Summary Stats */}
                {connection && myLoanRequests.length > 0 && (
                    <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                            <h3 className="text-3xl font-bold text-gray-800">Portfolio Summary</h3>
                            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm mb-1">Active</p>
                                        <p className="text-3xl font-bold text-green-600">
                                            {myLoanRequests.filter(loan => loan.statusLabel === "active").length}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xl">🟢</span>
                                    </div>
                                </div>
                            </div>
                            <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm mb-1">Funded</p>
                                        <p className="text-3xl font-bold text-blue-600">
                                            {myLoanRequests.filter(loan => loan.statusLabel === "funded").length}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xl">💰</span>
                                    </div>
                                </div>
                            </div>
                            <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm mb-1">Repaid</p>
                                        <p className="text-3xl font-bold text-purple-600">
                                            {myLoanRequests.filter(loan => loan.statusLabel === "repaid").length}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xl">✅</span>
                                    </div>
                                </div>
                            </div>
                            <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 hover:border-red-300 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm mb-1">Expired</p>
                                        <p className="text-3xl font-bold text-red-600">
                                            {myLoanRequests.filter(loan => loan.statusLabel === "expired").length}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xl">⏰</span>
                                    </div>
                                </div>
                            </div>
                            <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm mb-1">Defaulted</p>
                                        <p className="text-3xl font-bold text-gray-600">
                                            {myLoanRequests.filter(loan => loan.statusLabel === "defaulted").length}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xl">⚠️</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyLoanApplications;