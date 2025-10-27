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
    "function calculateDebt(uint256 _loanId) view returns (uint256)",
    "event LoanFunded(uint256 indexed loanId, address indexed lender, uint256 amount)",
    "event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 totalAmount)"
];

// Loan status enum matching the smart contract
enum LoanStatus {
    REQUESTED = 0,
    FUNDED = 1,
    REPAID = 2,
    DEFAULTED = 3
}

type FundedLoanDetails = {
    loanId: number;
    borrower: string;
    lender: string;
    loanAmount: bigint;
    interest: bigint;
    deadline: bigint;
    status: LoanStatus;
    createdAt: bigint;
    totalDebt: bigint;
    isActive: boolean;
    isOverdue: boolean;
    daysFromDeadline: number;
};

const LoansFunded: React.FC = () => {
    const { connection, isConnecting } = useWallet();
    const [fundedLoans, setFundedLoans] = useState<FundedLoanDetails[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    useEffect(() => {
        if (connection && connection.address) {
            loadFundedLoans();
            
            // Set up auto-refresh every 60 seconds
            const intervalId = setInterval(() => {
                loadFundedLoans();
            }, 60000);
            
            return () => clearInterval(intervalId);
        }
    }, [connection]);

    async function loadFundedLoans(): Promise<void> {
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

            const loans: FundedLoanDetails[] = [];
            const userAddress = connection.address.toLowerCase();
            const currentTime = Math.floor(Date.now() / 1000);

            // Fetch all loans and filter by lender address (loans I funded)
            for (let i = 1; i <= totalLoans; i++) {
                try {
                    const loan = await contract.getLoan(i);
                    
                    // Check if this loan was funded by the current user
                    // Lender address will be set when status is FUNDED or REPAID
                    if (loan.lender.toLowerCase() === userAddress && 
                        (loan.status === LoanStatus.FUNDED || loan.status === LoanStatus.REPAID || loan.status === LoanStatus.DEFAULTED)) {
                        
                        // Calculate total debt (loan + interest)
                        let totalDebt: bigint;
                        try {
                            totalDebt = await contract.calculateDebt(i);
                        } catch (err) {
                            // If calculateDebt fails, manually calculate
                            totalDebt = loan.loanAmount + loan.interest;
                        }

                        // Determine if loan is active (FUNDED status)
                        const isActive = loan.status === LoanStatus.FUNDED;
                        
                        // Check if loan is overdue
                        const isOverdue = isActive && Number(loan.deadline) < currentTime;
                        
                        // Calculate days from deadline
                        const deadlineTime = Number(loan.deadline);
                        const diffSeconds = Math.abs(deadlineTime - currentTime);
                        const daysFromDeadline = Math.ceil(diffSeconds / (60 * 60 * 24));

                        loans.push({
                            loanId: i,
                            borrower: loan.borrower,
                            lender: loan.lender,
                            loanAmount: loan.loanAmount,
                            interest: loan.interest,
                            deadline: loan.deadline,
                            status: loan.status,
                            createdAt: loan.createdAt,
                            totalDebt,
                            isActive,
                            isOverdue,
                            daysFromDeadline
                        });
                    }
                } catch (err) {
                    console.error(`Error fetching loan ${i}:`, err);
                }
            }

            // Sort loans: active first (with overdue at the top), then repaid, then defaulted
            loans.sort((a, b) => {
                // Active loans first
                if (a.isActive && !b.isActive) return -1;
                if (!a.isActive && b.isActive) return 1;
                
                // Within active loans, overdue first
                if (a.isActive && b.isActive) {
                    if (a.isOverdue && !b.isOverdue) return -1;
                    if (!a.isOverdue && b.isOverdue) return 1;
                    // Then by deadline (most urgent first)
                    return Number(a.deadline) - Number(b.deadline);
                }
                
                // Within inactive loans, repaid before defaulted
                if (a.status === LoanStatus.REPAID && b.status !== LoanStatus.REPAID) return -1;
                if (a.status !== LoanStatus.REPAID && b.status === LoanStatus.REPAID) return 1;
                
                // Finally by loan ID (newest first)
                return b.loanId - a.loanId;
            });

            setFundedLoans(loans);
            setLastUpdate(new Date());
        } catch (error) {
            console.error("Error loading funded loans:", error);
            setError("Failed to load funded loans. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    function handleManualRefresh(): void {
        if (connection) {
            loadFundedLoans();
        }
    }

    function weiToHbar(wei: bigint): string {
        return ethers.formatEther(wei);
    }

    function formatDate(timestamp: bigint): string {
        return new Date(Number(timestamp) * 1000).toLocaleString();
    }

    function getStatusBadge(status: LoanStatus): { text: string, className: string } {
        switch (status) {
            case LoanStatus.FUNDED:
                return { 
                    text: "Active", 
                    className: "bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium border border-yellow-200" 
                };
            case LoanStatus.REPAID:
                return { 
                    text: "Repaid", 
                    className: "bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium border border-green-200" 
                };
            case LoanStatus.DEFAULTED:
                return { 
                    text: "Defaulted", 
                    className: "bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium border border-gray-200" 
                };
            default:
                return { 
                    text: "Unknown", 
                    className: "bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-medium" 
                };
        }
    }

    // Filter loans by status
    const activeLoans = fundedLoans.filter(loan => loan.isActive);
    const repaidLoans = fundedLoans.filter(loan => loan.status === LoanStatus.REPAID);
    const defaultedLoans = fundedLoans.filter(loan => loan.status === LoanStatus.DEFAULTED);
    const overdueLoans = activeLoans.filter(loan => loan.isOverdue);

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
                    <div className="md:mb-6 lg:mb-0">
                        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent mb-4">
                            Loans I Have Funded
                        </h1>
                        <p className="text-gray-600 text-lg">Track and manage your funded loan portfolio on Hedera</p>
                        {lastUpdate && (
                            <p className="text-gray-500 text-sm mt-2">
                                Last updated: {lastUpdate.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                </div>

                {/* Wallet Connection Status */}
                {!connection ? (
                    <div className="mb-8 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-xl font-semibold mb-4 text-orange-600">Wallet Connection Required</h2>
                        <p className="text-gray-600">
                            Please connect your wallet using the sidebar wallet connection panel to view your funded loans.
                        </p>
                    </div>
                ) : (
                    <div className="mb-8 bg-gradient-to-r from-white to-orange-50 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <div>
                                    <p className="text-green-700 font-semibold">Wallet Connected</p>
                                    <p className="text-gray-600 text-sm">
                                        {connection.address.substring(0, 8)}...{connection.address.substring(connection.address.length - 8)}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleManualRefresh}
                                disabled={isLoading}
                                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Refreshing...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Refresh</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Error Messages */}
                {error && (
                    <div className="mb-8 bg-gradient-to-r from-red-50 to-red-100 backdrop-blur-xl border border-red-200 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Summary Stats */}
                <div className="mb-8 bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-gray-800">Portfolio Overview</h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 backdrop-blur-xl border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <h3 className="text-sm font-medium text-blue-700 mb-2">Total Loans Funded</h3>
                            <p className="text-3xl font-bold text-blue-900">{connection ? fundedLoans.length : 0}</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-green-100 backdrop-blur-xl border border-green-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <h3 className="text-sm font-medium text-green-700 mb-2">Loans Repaid</h3>
                            <p className="text-3xl font-bold text-green-900">{connection ? repaidLoans.length : 0}</p>
                        </div>
                        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 backdrop-blur-xl border border-yellow-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <h3 className="text-sm font-medium text-yellow-700 mb-2">Active Loans</h3>
                            <p className="text-3xl font-bold text-yellow-900">{connection ? activeLoans.length : 0}</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 backdrop-blur-xl border border-purple-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <h3 className="text-sm font-medium text-purple-700 mb-2">Overdue Loans</h3>
                            <p className="text-3xl font-bold text-purple-900">{connection ? overdueLoans.length : 0}</p>
                        </div>
                    </div>
                </div>

                {/* Active Loans Section */}
                <div className="mb-8 bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-full"></div>
                        <h2 className="text-3xl font-bold text-gray-800">Active Loans</h2>
                        <span className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 px-4 py-2 rounded-xl text-sm font-medium border border-yellow-300">
                            {connection ? activeLoans.length : 0}
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                    </div>

                    {!connection ? (
                        <div className="text-center py-16 bg-gray-100/60 rounded-2xl">
                            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                                <span className="text-3xl">🔐</span>
                            </div>
                            <p className="text-gray-700 text-xl">Connect your wallet to view active loans</p>
                            <p className="text-gray-500 mt-2">Your funded loans will appear here</p>
                        </div>
                    ) : isLoading ? (
                        <div className="text-center py-16">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                                <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-400 rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2" style={{animationDirection: 'reverse'}}></div>
                            </div>
                            <p className="text-gray-600 text-lg">Loading your active loans...</p>
                        </div>
                    ) : activeLoans.length === 0 ? (
                        <div className="text-center py-16 bg-gray-100/60 rounded-2xl">
                            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                                <span className="text-3xl">💼</span>
                            </div>
                            <p className="text-gray-700 text-xl">No active funded loans</p>
                            <p className="text-gray-500 mt-2">Your active loans will appear here once you fund them</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {activeLoans.map((loan, index) => {
                                const statusBadge = getStatusBadge(loan.status);
                                
                                return (
                                    <div 
                                        key={loan.loanId}
                                        className={`group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] ${
                                            loan.isOverdue ? 'border-red-300 bg-gradient-to-r from-red-50/80 to-red-100/80' : 'border-gray-200'
                                        }`}
                                        style={{animationDelay: `${index * 100}ms`}}
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                            {/* Borrower Info */}
                                            <div className="lg:col-span-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {loan.borrower.substring(2, 4).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600 text-sm">Borrower</p>
                                                        <p className="text-gray-800 font-mono text-sm">
                                                            {loan.borrower.substring(0, 8)}...{loan.borrower.substring(loan.borrower.length - 6)}
                                                        </p>
                                                        <p className="text-gray-500 text-xs mt-1">
                                                            Loan #{loan.loanId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Loan Details */}
                                            <div className="lg:col-span-4">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Loan Amount</p>
                                                        <p className="text-xl font-bold text-orange-600">
                                                            {weiToHbar(loan.loanAmount)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Interest</p>
                                                        <p className="text-lg font-semibold text-yellow-600">
                                                            {weiToHbar(loan.interest)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Expected Total</p>
                                                        <p className="text-lg font-bold text-green-600">
                                                            {weiToHbar(loan.totalDebt)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Deadline & Status */}
                                            <div className="lg:col-span-3">
                                                <div className="text-center">
                                                    <p className="text-gray-500 text-sm mb-1">Deadline</p>
                                                    <p className="text-gray-800 text-sm mb-2">{formatDate(loan.deadline)}</p>
                                                    <div className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium ${
                                                        loan.isOverdue 
                                                            ? 'bg-red-100 text-red-700 border border-red-200' 
                                                            : 'bg-green-100 text-green-700 border border-green-200'
                                                    }`}>
                                                        <div className={`w-2 h-2 rounded-full mr-2 ${
                                                            loan.isOverdue ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                                                        }`}></div>
                                                        {loan.isOverdue 
                                                            ? `${loan.daysFromDeadline} days overdue`
                                                            : `${loan.daysFromDeadline} days remaining`
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            {/* View on HashScan */}
                                            <div className="lg:col-span-2">
                                                <div className="text-right">
                                                    <a 
                                                        href={`https://hashscan.io/testnet/contract/${LOAN_CONTRACT_ADDRESS}`}
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm"
                                                    >
                                                        <span>View Contract</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                                        </svg>
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

                {/* Repaid Loans Section */}
                <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                        <h2 className="text-3xl font-bold text-gray-800">Repaid Loans</h2>
                        <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-4 py-2 rounded-xl text-sm font-medium border border-green-300">
                            {connection ? repaidLoans.length : 0}
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                    </div>

                    {!connection ? (
                        <div className="text-center py-16 bg-gray-100/60 rounded-2xl">
                            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                                <span className="text-3xl">🔐</span>
                            </div>
                            <p className="text-gray-700 text-xl">Connect your wallet to view repaid loans</p>
                            <p className="text-gray-500 mt-2">Your repaid loans will appear here</p>
                        </div>
                    ) : isLoading ? (
                        <div className="text-center py-16">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                                <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-400 rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2" style={{animationDirection: 'reverse'}}></div>
                            </div>
                            <p className="text-gray-600 text-lg">Loading your repaid loans...</p>
                        </div>
                    ) : repaidLoans.length === 0 ? (
                        <div className="text-center py-16 bg-gray-100/60 rounded-2xl">
                            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                                <span className="text-3xl">✅</span>
                            </div>
                            <p className="text-gray-700 text-xl">No repaid loans yet</p>
                            <p className="text-gray-500 mt-2">Successful repayments will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {repaidLoans.map((loan, index) => {
                                const statusBadge = getStatusBadge(loan.status);
                                
                                return (
                                    <div 
                                        key={loan.loanId}
                                        className="group bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-xl border border-green-200 rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]"
                                        style={{animationDelay: `${index * 100}ms`}}
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                            {/* Borrower Info */}
                                            <div className="lg:col-span-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        ✓
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600 text-sm">Borrower</p>
                                                        <p className="text-gray-800 font-mono text-sm">
                                                            {loan.borrower.substring(0, 8)}...{loan.borrower.substring(loan.borrower.length - 6)}
                                                        </p>
                                                        <p className="text-gray-500 text-xs mt-1">
                                                            Loan #{loan.loanId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Loan Details */}
                                            <div className="lg:col-span-4">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Loan Amount</p>
                                                        <p className="text-xl font-bold text-orange-600">
                                                            {weiToHbar(loan.loanAmount)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Interest</p>
                                                        <p className="text-lg font-semibold text-yellow-600">
                                                            {weiToHbar(loan.interest)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Total Received</p>
                                                        <p className="text-lg font-bold text-green-600">
                                                            {weiToHbar(loan.totalDebt)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Repayment Info */}
                                            <div className="lg:col-span-3">
                                                <div className="text-center">
                                                    <p className="text-gray-500 text-sm mb-1">Status</p>
                                                    <div className="mb-2">
                                                        <span className={statusBadge.className}>
                                                            {statusBadge.text}
                                                        </span>
                                                    </div>
                                                    <div className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-green-100 text-green-700 border border-green-200">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                                        Completed
                                                    </div>
                                                </div>
                                            </div>

                                            {/* View on HashScan */}
                                            <div className="lg:col-span-2">
                                                <div className="text-right">
                                                    <a 
                                                        href={`https://hashscan.io/testnet/contract/${LOAN_CONTRACT_ADDRESS}`}
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm"
                                                    >
                                                        <span>View Contract</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                                        </svg>
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

                {/* Defaulted Loans Section (if any) */}
                {defaultedLoans.length > 0 && (
                    <div className="mt-8 bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="w-1 h-8 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full"></div>
                            <h2 className="text-3xl font-bold text-gray-800">Defaulted Loans</h2>
                            <span className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm font-medium border border-gray-300">
                                {defaultedLoans.length}
                            </span>
                            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                        </div>

                        <div className="space-y-6">
                            {defaultedLoans.map((loan, index) => {
                                const statusBadge = getStatusBadge(loan.status);
                                
                                return (
                                    <div 
                                        key={loan.loanId}
                                        className="group bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-xl border border-gray-300 rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]"
                                        style={{animationDelay: `${index * 100}ms`}}
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                            {/* Borrower Info */}
                                            <div className="lg:col-span-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        ⚠️
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600 text-sm">Borrower</p>
                                                        <p className="text-gray-800 font-mono text-sm">
                                                            {loan.borrower.substring(0, 8)}...{loan.borrower.substring(loan.borrower.length - 6)}
                                                        </p>
                                                        <p className="text-gray-500 text-xs mt-1">
                                                            Loan #{loan.loanId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Loan Details */}
                                            <div className="lg:col-span-4">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Loan Amount</p>
                                                        <p className="text-xl font-bold text-orange-600">
                                                            {weiToHbar(loan.loanAmount)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Interest</p>
                                                        <p className="text-lg font-semibold text-yellow-600">
                                                            {weiToHbar(loan.interest)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Lost Amount</p>
                                                        <p className="text-lg font-bold text-red-600">
                                                            {weiToHbar(loan.totalDebt)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Info */}
                                            <div className="lg:col-span-3">
                                                <div className="text-center">
                                                    <p className="text-gray-500 text-sm mb-1">Status</p>
                                                    <div className="mb-2">
                                                        <span className={statusBadge.className}>
                                                            {statusBadge.text}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 text-xs">
                                                        Deadline: {formatDate(loan.deadline)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* View on HashScan */}
                                            <div className="lg:col-span-2">
                                                <div className="text-right">
                                                    <a 
                                                        href={`https://hashscan.io/testnet/contract/${LOAN_CONTRACT_ADDRESS}`}
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm"
                                                    >
                                                        <span>View Contract</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                                        </svg>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoansFunded;