import React, { useState, useEffect, useCallback } from "react";
import SignClient from "@walletconnect/sign-client";
import { Web3Modal } from "@web3modal/standalone";
import { getSdkError } from "@walletconnect/utils";
import { SessionTypes } from "@walletconnect/types";
import { Client } from "@hashgraph/sdk";

// ==================== CONFIGURATION ====================
const WALLETCONNECT_PROJECT_ID = "cb09000e29ac8eb293421c4501e4ecb9";
const CONTRACT_ID = "0.0.7091233";
const HEDERA_NETWORK = "testnet";

// ==================== TYPE DEFINITIONS ====================
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
    loanAmount: string;
    interest: string;
    deadline: number;
    status: LoanStatus;
    createdAt: number;
    totalDebt: string;
    isActive: boolean;
    isOverdue: boolean;
    daysFromDeadline: number;
};

// ==================== MAIN COMPONENT ====================
const LoansFunded: React.FC = () => {
    // WalletConnect State
    const [signClient, setSignClient] = useState<InstanceType<typeof SignClient> | null>(null);
    const [session, setSession] = useState<SessionTypes.Struct | null>(null);
    const [accountId, setAccountId] = useState<string | null>(null);
    const [hederaClient, setHederaClient] = useState<Client | null>(null);
    const [isWalletConnecting, setIsWalletConnecting] = useState(false);

    // Loan Data State
    const [fundedLoans, setFundedLoans] = useState<FundedLoanDetails[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [initialized, setInitialized] = useState<boolean>(false);

    // ==================== HEDERA CLIENT INITIALIZATION ====================
    useEffect(() => {
        const client = Client.forTestnet();
        setHederaClient(client);
        setInitialized(true);
    }, []);

    // ==================== WALLETCONNECT INITIALIZATION ====================
    const initializeWalletConnect = useCallback(async () => {
        try {
            const client = await SignClient.init({
                projectId: WALLETCONNECT_PROJECT_ID,
                metadata: {
                    name: "P2P Loan DApp",
                    description: "Peer-to-peer lending platform on Hedera",
                    url: window.location.origin,
                    icons: ["https://walletconnect.com/walletconnect-logo.png"],
                },
                relayUrl: "wss://relay.walletconnect.com",
            });
            setSignClient(client);

            client.on("session_delete", () => {
                console.log("Session deleted");
                setSession(null);
                setAccountId(null);
            });

            const sessions = client.session.getAll();
            if (sessions.length > 0) {
                const lastSession = sessions[sessions.length - 1];
                setSession(lastSession);
                const accounts = lastSession.namespaces.hedera?.accounts || [];
                if (accounts.length > 0) {
                    const accountIdFromSession = accounts[0].split(":")[2];
                    setAccountId(accountIdFromSession);
                }
            }
        } catch (error) {
            console.error("Failed to initialize WalletConnect:", error);
            setError("Failed to initialize WalletConnect. Please refresh the page.");
        }
    }, []);

    useEffect(() => {
        initializeWalletConnect();
    }, [initializeWalletConnect]);

    // ==================== WALLET CONNECTION ====================
    const connectWalletConnect = async () => {
        if (!signClient) {
            setError("WalletConnect not initialized. Please wait or refresh the page.");
            return;
        }

        try {
            setIsWalletConnecting(true);
            setError(null);

            const { uri, approval } = await signClient.connect({
                requiredNamespaces: {
                    hedera: {
                        methods: [
                            "hedera_signAndExecuteTransaction",
                            "hedera_executeTransaction",
                            "hedera_signTransaction"
                        ],
                        chains: [`hedera:${HEDERA_NETWORK}`],
                        events: ["chainChanged", "accountsChanged"],
                    },
                },
            });

            if (uri) {
                const web3Modal = new Web3Modal({
                    projectId: WALLETCONNECT_PROJECT_ID,
                    walletConnectVersion: 2,
                });
                await web3Modal.openModal({ uri });

                const approvalPromise = approval();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Connection timeout")), 120000)
                );

                const newSession = await Promise.race([approvalPromise, timeoutPromise]) as SessionTypes.Struct;

                web3Modal.closeModal();
                setSession(newSession);

                const accounts = newSession.namespaces.hedera?.accounts || [];
                if (accounts.length === 0) {
                    throw new Error("No accounts found in session");
                }

                const newAccountId = accounts[0].split(":")[2];
                if (!newAccountId.match(/^\d+\.\d+\.\d+$/)) {
                    throw new Error("Invalid Hedera account ID format");
                }

                setAccountId(newAccountId);
                console.log("Successfully connected to account:", newAccountId);
            }
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to connect wallet";
            setError(errorMessage);
        } finally {
            setIsWalletConnecting(false);
        }
    };

    // ==================== WALLET DISCONNECTION ====================
    const disconnectWallet = async () => {
        if (signClient && session) {
            try {
                await signClient.disconnect({
                    topic: session.topic,
                    reason: getSdkError("USER_DISCONNECTED"),
                });
            } catch (error) {
                console.error("Error disconnecting:", error);
            }
        }
        setSession(null);
        setAccountId(null);
        setFundedLoans([]);
    };

    // ==================== FETCH FUNDED LOANS ====================
    const loadFundedLoans = useCallback(async (): Promise<void> => {
        if (!accountId) return;

        try {
            setIsLoading(true);
            setError(null);

            console.log("Fetching funded loans for lender:", accountId);

            // Fetch LoanFunded events from Hedera Mirror Node
            // Event signature: LoanFunded(uint256 indexed loanId, address indexed lender, uint256 amount)
            const eventSignature = '0x27835a164e5897ebdea27c66543475ec5590e91c23081e85d661f3e575a1dd9d';
            
            const nowSeconds = Math.floor(Date.now() / 1000);
            const sixDaysAgoSeconds = nowSeconds - (6 * 24 * 60 * 60);
            
            const startTime = `${sixDaysAgoSeconds}.000000000`;
            const endTime = `${nowSeconds}.999999999`;
            
            const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${CONTRACT_ID}/results/logs?topic0=${eventSignature}&timestamp=gte:${startTime}&timestamp=lte:${endTime}&order=desc&limit=100`;
            
            console.log('Fetching loan funded events from:', mirrorNodeUrl);

            const eventsResponse = await fetch(mirrorNodeUrl);

            if (!eventsResponse.ok) {
                const errorText = await eventsResponse.text();
                console.error('Mirror node error:', errorText);
                throw new Error(`Failed to fetch loan funded events: ${eventsResponse.status}`);
            }

            const eventsData = await eventsResponse.json();
            console.log('LoanFunded events data:', eventsData);

            const loans: FundedLoanDetails[] = [];
            const currentTime = Math.floor(Date.now() / 1000);
            const myAccountIdLower = accountId.toLowerCase();

            if (eventsData.logs && eventsData.logs.length > 0) {
                for (const log of eventsData.logs) {
                    try {
                        const topics = log.topics || [];
                        const data = log.data;

                        if (topics.length >= 3 && data) {
                            // Extract loanId from topic 1
                            const loanIdHex = topics[1];
                            const loanId = parseInt(loanIdHex, 16);

                            // Extract lender address from topic 2
                            const lenderHex = topics[2];
                            const lenderAccountId = hexToAccountId(lenderHex);

                            console.log(`Checking loan ${loanId}: lender=${lenderAccountId}, myAccount=${accountId}`);

                            // Only process loans where I am the lender
                            if (lenderAccountId.toLowerCase() !== myAccountIdLower) {
                                console.log(`Skipping loan ${loanId}: not my funded loan`);
                                continue;
                            }

                            console.log(`Processing my funded loan ${loanId}`);

                            // Get full loan details from contract
                            const loanDetails = await getLoanDetails(loanId);
                            
                            if (loanDetails) {
                                // Only show FUNDED, REPAID, or DEFAULTED loans
                                if (loanDetails.status === LoanStatus.FUNDED || 
                                    loanDetails.status === LoanStatus.REPAID || 
                                    loanDetails.status === LoanStatus.DEFAULTED) {
                                    
                                    const isActive = loanDetails.status === LoanStatus.FUNDED;
                                    const isOverdue = isActive && loanDetails.deadline < currentTime;
                                    
                                    const deadlineTime = loanDetails.deadline;
                                    const diffSeconds = Math.abs(deadlineTime - currentTime);
                                    const daysFromDeadline = Math.ceil(diffSeconds / (60 * 60 * 24));

                                    const totalDebt = (BigInt(loanDetails.loanAmount) + BigInt(loanDetails.interest)).toString();

                                    loans.push({
                                        loanId,
                                        borrower: loanDetails.borrower,
                                        lender: lenderAccountId,
                                        loanAmount: loanDetails.loanAmount,
                                        interest: loanDetails.interest,
                                        deadline: loanDetails.deadline,
                                        status: loanDetails.status,
                                        createdAt: loanDetails.createdAt,
                                        totalDebt,
                                        isActive,
                                        isOverdue,
                                        daysFromDeadline
                                    });

                                    console.log(`Added funded loan ${loanId} with status: ${loanDetails.status}`);
                                }
                            }
                        }
                    } catch (eventError) {
                        console.error('Error processing loan funded event:', eventError, log);
                    }
                }
            }

            // Sort loans: active first (with overdue at the top), then repaid, then defaulted
            loans.sort((a, b) => {
                if (a.isActive && !b.isActive) return -1;
                if (!a.isActive && b.isActive) return 1;
                
                if (a.isActive && b.isActive) {
                    if (a.isOverdue && !b.isOverdue) return -1;
                    if (!a.isOverdue && b.isOverdue) return 1;
                    return a.deadline - b.deadline;
                }
                
                if (a.status === LoanStatus.REPAID && b.status !== LoanStatus.REPAID) return -1;
                if (a.status !== LoanStatus.REPAID && b.status === LoanStatus.REPAID) return 1;
                
                return b.loanId - a.loanId;
            });

            console.log(`Found ${loans.length} funded loans for account ${accountId}`);
            setFundedLoans(loans);
            setLastUpdate(new Date());

        } catch (error) {
            console.error("Error loading funded loans:", error);
            setError("Failed to load funded loans. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [accountId]);

    // Load loans when account connects and set up auto-refresh
    useEffect(() => {
        if (accountId && initialized) {
            loadFundedLoans();
            
            const intervalId = setInterval(() => {
                loadFundedLoans();
            }, 60000);
            
            return () => clearInterval(intervalId);
        }
    }, [accountId, initialized, loadFundedLoans]);

    // ==================== HELPER FUNCTIONS ====================
    const hexToAccountId = (hex: string): string => {
        try {
            let cleanHex = hex.startsWith('0x') ? hex.substring(2) : hex;
            
            if (cleanHex.length % 2 !== 0) {
                cleanHex = '0' + cleanHex;
            }
            
            const trimmedHex = cleanHex.replace(/^0+/, '') || '0';
            const bigIntValue = BigInt('0x' + trimmedHex);
            const accountNum = bigIntValue.toString(10);
            
            return `0.0.${accountNum}`;
        } catch (error) {
            console.error('Error converting hex to account ID:', hex, error);
            return '0.0.0';
        }
    };

    const getLoanDetails = async (loanId: number): Promise<{
        status: LoanStatus,
        borrower: string,
        lender: string,
        loanAmount: string,
        interest: string,
        deadline: number,
        createdAt: number
    } | null> => {
        try {
            const functionSelector = '504006ca';
            const paddedLoanId = loanId.toString(16).padStart(64, '0');
            const callData = '0x' + functionSelector + paddedLoanId;

            const contractIdParts = CONTRACT_ID.split('.');
            const contractNum = parseInt(contractIdParts[2]);
            const contractHex = '0x' + contractNum.toString(16).padStart(40, '0');

            const requestBody = {
                data: callData,
                to: contractHex,
                estimate: false,
                gas: 100000
            };

            const response = await fetch(
                'https://testnet.mirrornode.hedera.com/api/v1/contracts/call',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                }
            );

            if (!response.ok) {
                console.error(`Failed to get details for loan ${loanId}`);
                return null;
            }

            const result = await response.json();
            
            if (result.result) {
                const resultHex = result.result.startsWith('0x') ? result.result.substring(2) : result.result;
                
                // Parse loan struct
                const borrowerHex = resultHex.substring(0, 64);
                const lenderHex = resultHex.substring(64, 128);
                const loanAmountHex = resultHex.substring(128, 192);
                const interestHex = resultHex.substring(192, 256);
                const deadlineHex = resultHex.substring(256, 320);
                const statusHex = resultHex.substring(320, 384);
                const createdAtHex = resultHex.substring(384, 448);
                
                const borrowerAccountId = hexToAccountId('0x' + borrowerHex);
                const lenderAccountId = hexToAccountId('0x' + lenderHex);
                const loanAmount = BigInt('0x' + loanAmountHex).toString();
                const interest = BigInt('0x' + interestHex).toString();
                const deadline = parseInt(deadlineHex, 16);
                const status = parseInt(statusHex, 16) as LoanStatus;
                const createdAt = parseInt(createdAtHex, 16);
                
                console.log(`Loan ${loanId} details: status=${status}, borrower=${borrowerAccountId}, lender=${lenderAccountId}`);
                
                return {
                    status,
                    borrower: borrowerAccountId,
                    lender: lenderAccountId,
                    loanAmount,
                    interest,
                    deadline,
                    createdAt
                };
            }

            return null;
        } catch (error) {
            console.error(`Error getting loan details for ${loanId}:`, error);
            return null;
        }
    };

    function handleManualRefresh(): void {
        if (accountId) {
            loadFundedLoans();
        }
    }

    function formatAmount(amount: string): string {
        const amountNum = parseInt(amount);
        return amountNum.toLocaleString();
    }

    function formatDate(timestamp: number): string {
        return new Date(timestamp * 1000).toLocaleString();
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

    // If we're still initializing, show a loading indicator
    if (!initialized) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-3"></div>
                <p>Initializing application...</p>
            </div>
        );
    }

    // ==================== RENDER ====================
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
                {!accountId ? (
                    <div className="mb-8 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-xl font-semibold mb-4 text-orange-600">Connect Wallet</h2>
                        <button
                            onClick={connectWalletConnect}
                            disabled={isWalletConnecting || !signClient}
                            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50"
                        >
                            {isWalletConnecting ? "Connecting..." : "Connect Wallet"}
                        </button>
                    </div>
                ) : (
                    <div className="mb-8 bg-gradient-to-r from-white to-orange-50 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <div>
                                    <p className="text-green-700 font-semibold">Wallet Connected</p>
                                    <p className="text-gray-600 text-sm">
                                        {accountId.substring(0, 8)}...{accountId.substring(accountId.length - 6)}
                                    </p>
                                </div>
                                <button
                                    onClick={disconnectWallet}
                                    className="ml-2 text-xs text-red-600 hover:text-red-700"
                                >
                                    Disconnect
                                </button>
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
                            <p className="text-3xl font-bold text-blue-900">{accountId ? fundedLoans.length : 0}</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-green-100 backdrop-blur-xl border border-green-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <h3 className="text-sm font-medium text-green-700 mb-2">Loans Repaid</h3>
                            <p className="text-3xl font-bold text-green-900">{accountId ? repaidLoans.length : 0}</p>
                        </div>
                        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 backdrop-blur-xl border border-yellow-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <h3 className="text-sm font-medium text-yellow-700 mb-2">Active Loans</h3>
                            <p className="text-3xl font-bold text-yellow-900">{accountId ? activeLoans.length : 0}</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 backdrop-blur-xl border border-purple-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <h3 className="text-sm font-medium text-purple-700 mb-2">Overdue Loans</h3>
                            <p className="text-3xl font-bold text-purple-900">{accountId ? overdueLoans.length : 0}</p>
                        </div>
                    </div>
                </div>

                {/* Active Loans Section */}
                <div className="mb-8 bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-full"></div>
                        <h2 className="text-3xl font-bold text-gray-800">Active Loans</h2>
                        <span className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 px-4 py-2 rounded-xl text-sm font-medium border border-yellow-300">
                            {accountId ? activeLoans.length : 0}
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                    </div>

                    {!accountId ? (
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
                                                        {loan.borrower.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600 text-sm">Borrower</p>
                                                        <p className="text-gray-800 font-mono text-sm">
                                                            {loan.borrower.length > 16 
                                                                ? `${loan.borrower.substring(0, 8)}...${loan.borrower.substring(loan.borrower.length - 6)}`
                                                                : loan.borrower
                                                            }
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
                                                            {formatAmount(loan.loanAmount)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Interest</p>
                                                        <p className="text-lg font-semibold text-yellow-600">
                                                            {formatAmount(loan.interest)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Expected Total</p>
                                                        <p className="text-lg font-bold text-green-600">
                                                            {formatAmount(loan.totalDebt)} <span className="text-sm text-gray-500">HBAR</span>
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
                                                        href={`https://hashscan.io/testnet/contract/${CONTRACT_ID}`}
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
                <div className="mb-8 bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                        <h2 className="text-3xl font-bold text-gray-800">Repaid Loans</h2>
                        <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-4 py-2 rounded-xl text-sm font-medium border border-green-300">
                            {accountId ? repaidLoans.length : 0}
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                    </div>

                    {!accountId ? (
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
                                                            {loan.borrower.length > 16 
                                                                ? `${loan.borrower.substring(0, 8)}...${loan.borrower.substring(loan.borrower.length - 6)}`
                                                                : loan.borrower
                                                            }
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
                                                            {formatAmount(loan.loanAmount)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Interest</p>
                                                        <p className="text-lg font-semibold text-yellow-600">
                                                            {formatAmount(loan.interest)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Total Received</p>
                                                        <p className="text-lg font-bold text-green-600">
                                                            {formatAmount(loan.totalDebt)} <span className="text-sm text-gray-500">HBAR</span>
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
                                                        href={`https://hashscan.io/testnet/contract/${CONTRACT_ID}`}
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
                    <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
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
                                                            {loan.borrower.length > 16 
                                                                ? `${loan.borrower.substring(0, 8)}...${loan.borrower.substring(loan.borrower.length - 6)}`
                                                                : loan.borrower
                                                            }
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
                                                            {formatAmount(loan.loanAmount)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Interest</p>
                                                        <p className="text-lg font-semibold text-yellow-600">
                                                            {formatAmount(loan.interest)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Lost Amount</p>
                                                        <p className="text-lg font-bold text-red-600">
                                                            {formatAmount(loan.totalDebt)} <span className="text-sm text-gray-500">HBAR</span>
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
                                                        href={`https://hashscan.io/testnet/contract/${CONTRACT_ID}`}
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