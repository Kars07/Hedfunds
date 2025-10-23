import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "./Dashboard";
import SignClient from "@walletconnect/sign-client";
import { Web3Modal } from "@web3modal/standalone";
import { getSdkError } from "@walletconnect/utils";
import { SessionTypes } from "@walletconnect/types";
import {
  ContractExecuteTransaction,
  ContractFunctionParameters,
  AccountId,
  TransactionId,
  Client,
  Hbar,
  HbarUnit,
} from "@hashgraph/sdk";

// WalletConnect configuration
const WALLETCONNECT_PROJECT_ID = "cb09000e29ac8eb293421c4501e4ecb9";
const CONTRACT_ID = "0.0.7091233";
const HEDERA_NETWORK = "testnet";

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
        wallets, 
        isConnecting,
    } = useWallet();
    
    // WalletConnect state
    const [signClient, setSignClient] = useState<InstanceType<typeof SignClient> | null>(null);
    const [session, setSession] = useState<SessionTypes.Struct | null>(null);
    const [accountId, setAccountId] = useState<string | null>(null);
    const [hederaClient, setHederaClient] = useState<Client | null>(null);
    const [isWalletConnecting, setIsWalletConnecting] = useState(false);
    
    // Credit score state
    const [creditScore, setCreditScore] = useState<CreditScoreData | null>(null);
    const [loadingCreditScore, setLoadingCreditScore] = useState<boolean>(false);
    
    // Loan request form state
    const [loanAmount, setLoanAmount] = useState<number>(50000);
    const [interest, setInterest] = useState<number>(10000);
    const [deadlineDays, setDeadlineDays] = useState<number>(7);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [requestId, setRequestId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [inputError, setInputError] = useState<{
        loanAmount?: string;
        interest?: string;
        deadline?: string;
    }>({});

    // Initialize Hedera client
    useEffect(() => {
        const client = Client.forTestnet();
        client.setDefaultMaxTransactionFee(new Hbar(1, HbarUnit.Hbar));
        setHederaClient(client);
    }, []);

    // Initialize WalletConnect
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

            // Set up event listeners
            client.on("session_delete", () => {
                console.log("Session deleted");
                setSession(null);
                setAccountId(null);
            });

            // Check for existing sessions
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

    // Connect WalletConnect
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
                
                // Wait for approval with timeout
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

    // Disconnect wallet
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
        setCreditScore(null);
    };

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

    // Load credit score when wallet is connected
    useEffect(() => {
        if (accountId) {
            fetchCreditScore(accountId);
        }
    }, [accountId, fetchCreditScore]);

    // Get maximum loan amount based on credit score
    const getMaxLoanAmountByCreditScore = useCallback((creditScore: number): number => {
        if (creditScore >= 750) return 500000;
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
    
    // Format currency
    const formatCurrency = useCallback((amount: number): string => {
        return amount.toLocaleString('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }, []);

    // Handle loan amount change with validation
    const handleLoanAmountChange = useCallback((value: number): void => {
        setInputError(prev => ({ ...prev, loanAmount: undefined }));
        
        const maxAmount = creditScore ? getMaxLoanAmountByCreditScore(creditScore.current_score) : 40000;
        
        if (value > maxAmount) {
            setInputError(prev => ({ 
                ...prev, 
                loanAmount: `Your credit score (${creditScore?.current_score || 'N/A'}) limits you to a maximum of ${formatCurrency(maxAmount)}`
            }));
            setLoanAmount(value);
        } else {
            setLoanAmount(value);
        }
    }, [creditScore, getMaxLoanAmountByCreditScore, formatCurrency]);

    // Request loan on smart contract
    const requestLoanOnContract = async (loanAmountValue: number, interestValue: number, deadlineTimestamp: number): Promise<string> => {
        if (!signClient || !session || !accountId || !hederaClient) {
            throw new Error("Wallet not connected or Hedera client not initialized");
        }

        try {
            const accountIdObj = AccountId.fromString(accountId);
            const transactionId = TransactionId.generate(accountIdObj);
            
            console.log("Generated Transaction ID:", transactionId.toString());
            console.log("Requesting loan with params:", { loanAmountValue, interestValue, deadlineTimestamp });

            // Create contract function parameters - using function signature: requestLoan(uint256,uint256,uint256)
            const params = new ContractFunctionParameters()
                .addUint256(loanAmountValue)
                .addUint256(interestValue)
                .addUint256(deadlineTimestamp);

            // Create the transaction
            const transaction = new ContractExecuteTransaction()
                .setContractId(CONTRACT_ID)
                .setGas(1000000)
                .setFunction("requestLoan", params)
                .setTransactionId(transactionId);

            console.log("Transaction before freeze:", transaction.toString());
            
            // Freeze the transaction
            const frozenTx = await transaction.freezeWith(hederaClient);
            const txBytes = frozenTx.toBytes();
            
            console.log("Transaction bytes length:", txBytes.length);
            console.log("Sending request to WalletConnect with topic:", session.topic);

            // Different wallets expect different formats
            // Try the Kabila format first (with signerAccountId and transactionList)
            try {
                const result = await signClient.request({
                    topic: session.topic,
                    chainId: `hedera:${HEDERA_NETWORK}`,
                    request: {
                        method: "hedera_signAndExecuteTransaction",
                        params: {
                            signerAccountId: `hedera:${HEDERA_NETWORK}:${accountId}`,
                            transactionList: Buffer.from(txBytes).toString("base64"),
                        },
                    },
                });

                console.log("Transaction result from WalletConnect (Kabila format):", result);
                return typeof result === 'string' ? result : JSON.stringify(result);
            } catch (firstError) {
                console.log("Kabila format failed, trying HashPack format...", firstError);
                
                // Try HashPack format (with signerId)
                try {
                    const result = await signClient.request({
                        topic: session.topic,
                        chainId: `hedera:${HEDERA_NETWORK}`,
                        request: {
                            method: "hedera_executeTransaction",
                            params: {
                                signerId: accountId,
                                transactionBytes: Buffer.from(txBytes).toString("base64"),
                            },
                        },
                    });

                    console.log("Transaction result from WalletConnect (HashPack format):", result);
                    return typeof result === 'string' ? result : JSON.stringify(result);
                } catch (secondError) {
                    console.log("HashPack format failed, trying Blade format...", secondError);
                    
                    // Try Blade wallet format
                    const result = await signClient.request({
                        topic: session.topic,
                        chainId: `hedera:${HEDERA_NETWORK}`,
                        request: {
                            method: "hedera_signTransaction",
                            params: {
                                signerAccountId: accountId,
                                transactionBytes: Buffer.from(txBytes).toString("base64"),
                            },
                        },
                    });

                    console.log("Transaction result from WalletConnect (Blade format):", result);
                    return typeof result === 'string' ? result : JSON.stringify(result);
                }
            }
        } catch (error) {
            console.error("Error executing contract transaction:", error);
            throw error;
        }
    };

    // Create loan request function
    const createLoanRequest = useCallback(async (): Promise<void> => {
        if (!accountId) {
            setError("Please connect your wallet first");
            return;
        }

        if (!creditScore) {
            setError("Credit score not loaded. Please wait a moment and try again.");
            return;
        }

        if (loanAmount <= 0) {
            setError("Loan amount must be greater than zero");
            return;
        }

        const maxAmount = getMaxLoanAmountByCreditScore(creditScore.current_score);
        
        if (loanAmount > maxAmount) {
            setError(`Your credit score (${creditScore.current_score}) limits you to a maximum loan of ${formatCurrency(maxAmount)}`);
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            setRequestId(null);
            
            // Create the deadline timestamp (Unix timestamp in seconds)
            const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadlineDays * 24 * 60 * 60);
            
            console.log("Submitting loan request to smart contract...");
            
            // Call smart contract function
            const txResult = await requestLoanOnContract(loanAmount, interest, deadlineTimestamp);
            
            console.log("Smart contract transaction result:", txResult);
            
            // Parse transaction result
            let transactionData;
            try {
                transactionData = typeof txResult === 'string' ? JSON.parse(txResult) : txResult;
            } catch (e) {
                transactionData = { transactionId: txResult };
            }
            
            // Submit loan request to API as well (optional - for tracking)
            try {
                const deadline = new Date(deadlineTimestamp * 1000); // Convert back to Date
                
                const response = await fetch(`${API_URL}/request`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: accountId,
                        loanAmount: loanAmount,
                        interest: interest,
                        deadline: deadline.toISOString(),
                        creditScore: creditScore.current_score,
                        transactionId: transactionData.transactionId || txResult,
                        transactionHash: transactionData.transactionHash || null,
                        nodeId: transactionData.nodeId || null
                    })
                });
                
                if (!response.ok) {
                    console.warn("API call failed but smart contract succeeded:", await response.text());
                    // Don't throw error - smart contract succeeded
                    setRequestId(transactionData.transactionId || txResult);
                    setError(null);
                } else {
                    const data = await response.json();
                    
                    if (data.status === 'success') {
                        console.log("Loan request submitted successfully. Request ID:", data.requestId);
                        setRequestId(data.requestId);
                        setError(null);
                    } else {
                        console.warn("API returned non-success status:", data.message);
                        setRequestId(transactionData.transactionId || txResult);
                        setError(null);
                    }
                }
            } catch (apiError) {
                console.warn("API error but smart contract succeeded:", apiError);
                // Smart contract succeeded, show success with transaction ID
                setRequestId(transactionData.transactionId || txResult);
                setError(null);
            }
            
        } catch (error) {
            console.error("Error creating loan request:", error);
            setError(error instanceof Error ? error.message : "Failed to create loan request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }, [
        accountId,
        creditScore,
        loanAmount,
        interest,
        deadlineDays,
        getMaxLoanAmountByCreditScore,
        formatCurrency
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
                    {!accountId ? (
                        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
                            <h2 className="text-xl font-semibold mb-4 text-orange-600">Connect Wallet</h2>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={connectWalletConnect}
                                    disabled={isWalletConnecting || !signClient}
                                    className="group flex items-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50"
                                >
                                    {isWalletConnecting ? "Connecting..." : "Connect WalletConnect"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="md:mb-2 md:px-3">
                            <div className="md:flex hidden items-center space-x-3 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-2xl">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <div>
                                    <p className="text-green-700 text-[13px] font-semibold">Wallet Connected</p>
                                    <p className="text-gray-600 text-[10px]">
                                        {accountId.substring(0, 12)}...{accountId.substring(accountId.length - 6)}
                                    </p>
                                </div>
                                <button
                                    onClick={disconnectWallet}
                                    className="ml-2 text-xs text-red-600 hover:text-red-700"
                                >
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Credit Score Display */}
            {accountId && (
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
                                                <span className="p-1"></span> {formatCurrency(getMaxLoanAmountByCreditScore(creditScore.current_score))}
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
            {accountId && (
                <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                        <h2 className="text-3xl font-bold text-gray-800">Create Loan Request</h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Loan Amount
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={loanAmount}
                                    onChange={(e) => handleLoanAmountChange(Number(e.target.value))}
                                    className={`w-full px-4 py-4 bg-white/80 backdrop-blur-xl border ${
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
                                        Max: {formatCurrency(getMaxLoanAmountByCreditScore(creditScore.current_score))}
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
                                Interest
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={interest}
                                    onChange={(e) => setInterest(Number(e.target.value))}
                                    className="w-full px-4 py-4 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl transition-all duration-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                        <div className="text-xl font-bold text-orange-600">{formatCurrency(loanAmount)}</div>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/40">
                                        <div className="text-sm text-gray-600">Interest</div>
                                        <div className="text-xl font-bold text-yellow-600">{formatCurrency(interest)}</div>
                                    </div>
                                </div>
                                
                                <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-white/40">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-medium text-gray-700">Total to Repay:</span>
                                        <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                                            {formatCurrency(loanAmount + interest)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                                        <span>Interest Rate:</span>
                                        <span className="font-medium">{loanAmount > 0 ? ((interest / loanAmount) * 100).toFixed(1) : 0}%</span>
                                    </div>
                                </div>
                                
                                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/40">
                                    <div className="text-sm text-gray-600 mb-1">Deadline</div>
                                    <div className="font-semibold text-gray-800">
                                        {deadlineDays} {deadlineDays === 1 ? 'day' : 'days'} from now
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
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
                            (creditScore && loanAmount > getMaxLoanAmountByCreditScore(creditScore.current_score))
                        }
                        className="w-full md:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Submitting to Smart Contract...</span>
                            </div>
                        ) : loadingCreditScore ? "Loading credit score..." :
                         !creditScore ? "Credit score unavailable" :
                         (creditScore && loanAmount > getMaxLoanAmountByCreditScore(creditScore.current_score)) ? 
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
