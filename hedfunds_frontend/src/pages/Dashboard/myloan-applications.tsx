import React, { useState, useEffect, useCallback } from "react";
import SignClient from "@walletconnect/sign-client";
import { Web3Modal } from "@web3modal/standalone";
import { getSdkError } from "@walletconnect/utils";
import { SessionTypes } from "@walletconnect/types";
import {
  ContractCallQuery,
  ContractFunctionParameters,
  AccountId,
  Client,
} from "@hashgraph/sdk";

// ==================== CONFIGURATION ====================
const WALLETCONNECT_PROJECT_ID = "cb09000e29ac8eb293421c4501e4ecb9";
const CONTRACT_ID = "0.0.7091233";
const HEDERA_NETWORK = "testnet";

// ==================== TYPE DEFINITIONS ====================
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
    loanAmount: string;
    interest: string;
    deadline: number;
    status: LoanStatus;
    createdAt: number;
    statusLabel: "active" | "funded" | "repaid" | "defaulted" | "expired";
};

// ==================== MAIN COMPONENT ====================
const MyLoanApplications: React.FC = () => {
    // WalletConnect State
    const [signClient, setSignClient] = useState<InstanceType<typeof SignClient> | null>(null);
    const [session, setSession] = useState<SessionTypes.Struct | null>(null);
    const [accountId, setAccountId] = useState<string | null>(null);
    const [hederaClient, setHederaClient] = useState<Client | null>(null);
    const [isWalletConnecting, setIsWalletConnecting] = useState(false);

    // Loan Data State
    const [myLoanRequests, setMyLoanRequests] = useState<LoanData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // ==================== HEDERA CLIENT INITIALIZATION ====================
    useEffect(() => {
        const client = Client.forTestnet();
        setHederaClient(client);
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
        setMyLoanRequests([]);
    };

    // ==================== FETCH MY LOAN REQUESTS ====================
    const fetchMyLoanRequests = useCallback(async (): Promise<void> => {
        if (!accountId) return;

        try {
            setIsLoading(true);
            setError(null);

            console.log("Fetching loans for account:", accountId);

            // Fetch LoanRequested events from Hedera Mirror Node
            const eventSignature = '0xf6cc19e46a340ab5888d736bfc79aef72ae92d12d7b76319d72b0abc170868e6';
            
            const nowSeconds = Math.floor(Date.now() / 1000);
            const sixDaysAgoSeconds = nowSeconds - (6 * 24 * 60 * 60);
            
            const startTime = `${sixDaysAgoSeconds}.000000000`;
            const endTime = `${nowSeconds}.999999999`;
            
            const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${CONTRACT_ID}/results/logs?topic0=${eventSignature}&timestamp=gte:${startTime}&timestamp=lte:${endTime}&order=desc&limit=100`;
            
            console.log('Fetching loan events from:', mirrorNodeUrl);

            const eventsResponse = await fetch(mirrorNodeUrl);

            if (!eventsResponse.ok) {
                const errorText = await eventsResponse.text();
                console.error('Mirror node error:', errorText);
                throw new Error(`Failed to fetch loan events: ${eventsResponse.status}`);
            }

            const eventsData = await eventsResponse.json();
            console.log('LoanRequested events data:', eventsData);

            const loans: LoanData[] = [];
            const currentTime = Math.floor(Date.now() / 1000);

            // Convert accountId to compare with blockchain data
            const accountIdParts = accountId.split('.');
            const accountNum = accountIdParts[2];
            const myAccountIdLower = accountId.toLowerCase();

            if (eventsData.logs && eventsData.logs.length > 0) {
                for (const log of eventsData.logs) {
                    try {
                        const topics = log.topics || [];
                        const data = log.data;

                        if (topics.length >= 3 && data) {
                            const loanIdHex = topics[1];
                            const loanId = parseInt(loanIdHex, 16);

                            const borrowerHex = topics[2];
                            const borrowerAccountId = hexToAccountId(borrowerHex);

                            console.log(`Checking loan ${loanId}: borrower=${borrowerAccountId}, myAccount=${accountId}`);

                            // Only process loans where I am the borrower
                            if (borrowerAccountId.toLowerCase() !== myAccountIdLower) {
                                console.log(`Skipping loan ${loanId}: not my loan`);
                                continue;
                            }

                            console.log(`Processing my loan ${loanId}`);

                            let dataHex = data;
                            if (!data.startsWith('0x')) {
                                try {
                                    const decoded = atob(data);
                                    dataHex = '0x' + Array.from(decoded).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
                                } catch (e) {
                                    console.warn('Failed to decode base64 data:', e);
                                }
                            }
                            
                            dataHex = dataHex.startsWith('0x') ? dataHex.substring(2) : dataHex;
                            
                            const loanAmountHex = dataHex.substring(0, 64);
                            const interestHex = dataHex.substring(64, 128);
                            const deadlineHex = dataHex.substring(128, 192);

                            const loanAmount = loanAmountHex ? BigInt('0x' + loanAmountHex).toString() : '0';
                            const interest = interestHex ? BigInt('0x' + interestHex).toString() : '0';
                            const deadline = deadlineHex ? parseInt(deadlineHex, 16) : 0;

                            // Get full loan details from contract to check current status
                            const loanDetails = await getLoanDetails(loanId);
                            
                            if (loanDetails) {
                                let statusLabel: "active" | "funded" | "repaid" | "defaulted" | "expired";
                                
                                if (loanDetails.status === LoanStatus.REQUESTED) {
                                    if (deadline < currentTime) {
                                        statusLabel = "expired";
                                    } else {
                                        statusLabel = "active";
                                    }
                                } else if (loanDetails.status === LoanStatus.FUNDED) {
                                    statusLabel = "funded";
                                } else if (loanDetails.status === LoanStatus.REPAID) {
                                    statusLabel = "repaid";
                                } else if (loanDetails.status === LoanStatus.DEFAULTED) {
                                    statusLabel = "defaulted";
                                } else {
                                    statusLabel = "active";
                                }

                                loans.push({
                                    loanId,
                                    borrower: borrowerAccountId,
                                    lender: loanDetails.lender,
                                    loanAmount,
                                    interest,
                                    deadline,
                                    status: loanDetails.status,
                                    createdAt: log.timestamp ? Math.floor(new Date(log.timestamp).getTime() / 1000) : currentTime,
                                    statusLabel
                                });

                                console.log(`Added loan ${loanId} with status: ${statusLabel}`);
                            }
                        }
                    } catch (eventError) {
                        console.error('Error processing loan event:', eventError, log);
                    }
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
                
                return a.deadline - b.deadline;
            });

            console.log(`Found ${loans.length} loans for account ${accountId}`);
            setMyLoanRequests(loans);

        } catch (error) {
            console.error("Error fetching loan requests:", error);
            setError("Failed to fetch your loan requests. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [accountId]);

    // Fetch loans when account connects
    useEffect(() => {
        if (accountId) {
            fetchMyLoanRequests();
        }
    }, [accountId, fetchMyLoanRequests]);

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

    const getLoanDetails = async (loanId: number): Promise<{status: LoanStatus, lender: string} | null> => {
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
                
                // Parse lender address (bytes 32-63, 64 hex chars)
                const lenderHex = resultHex.substring(64, 128);
                const lenderAccountId = hexToAccountId('0x' + lenderHex);
                
                // Parse status (bytes 160-191, 64 hex chars)
                const statusHex = resultHex.substring(320, 384);
                const status = parseInt(statusHex, 16) as LoanStatus;
                
                console.log(`Loan ${loanId} details: status=${status}, lender=${lenderAccountId}`);
                
                return { status, lender: lenderAccountId };
            }

            return null;
        } catch (error) {
            console.error(`Error getting loan details for ${loanId}:`, error);
            return null;
        }
    };

    function refreshLoanData(): void {
        if (accountId) {
            fetchMyLoanRequests();
        }
    }

    function formatDate(timestamp: number): string {
        return new Date(timestamp * 1000).toLocaleString();
    }

    function formatAmount(amount: string): string {
        const amountNum = parseInt(amount);
        return amountNum.toLocaleString();
    }

    function getDaysRemaining(deadline: number): number {
        const now = Math.floor(Date.now() / 1000);
        const diffSeconds = deadline - now;
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

    // ==================== RENDER ====================
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
                        {!accountId ? (
                            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
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
                            <div className="bg-orange-50 border border-orange-200 rounded-2xl md:p-4 p-2 shadow-2xl">
                                <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 bg-green-500 mb-6 rounded-full animate-pulse"></div>
                                    <div>
                                        <p className="text-green-600 text-[13px] font-semibold">Wallet Connected</p>
                                        <p className="text-gray-600 text-[11px]">
                                            {accountId.substring(0, 12)}...{accountId.substring(accountId.length - 6)}
                                        </p>
                                        <div className="mt-2 flex items-center space-x-2">
                                            <button 
                                                onClick={refreshLoanData}
                                                className="text-green-600 hover:text-green-700 cursor-pointer text-sm font-medium flex items-center"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                Refresh
                                            </button>
                                            <button
                                                onClick={disconnectWallet}
                                                className="text-xs text-red-600 hover:text-red-700"
                                            >
                                                Disconnect
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
                    ) : !accountId ? (
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
                                                            {formatAmount(loan.loanAmount)} <span className="text-sm text-gray-500">HBAR</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Interest</p>
                                                        <p className="text-xl font-semibold text-yellow-600">
                                                            {formatAmount(loan.interest)} <span className="text-sm text-gray-500">HBAR</span>
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
                                                        href={`https://hashscan.io/testnet/contract/${CONTRACT_ID}`}
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
                {accountId && myLoanRequests.length > 0 && (
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