import React, { useState, useEffect, useCallback } from "react";
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

// ==================== CONFIGURATION ====================
const WALLETCONNECT_PROJECT_ID = "cb09000e29ac8eb293421c4501e4ecb9";
const CONTRACT_ID = "0.0.7091233";
const HEDERA_NETWORK = "testnet";
const API_URL = "https://swiftfund-6b61.onrender.com/api/loans";

// ==================== TYPE DEFINITIONS ====================
type FundedLoan = {
  loanId: number;
  borrower: string;
  lender: string;
  loanAmount: string;
  interest: string;
  deadline: number;
  status: number;
  createdAt: number;
  fundedAt: number;
};

type CreditScoreData = {
  current_score: number;
  total_loans: number;
  on_time_payments: number;
  early_payments: number;
  late_payments: number;
};

// ==================== CREDIT SCORE GUIDE ====================
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

// ==================== MAIN COMPONENT ====================
const LoanToBeRepaid: React.FC = () => {
  // WalletConnect State
  const [signClient, setSignClient] = useState<InstanceType<typeof SignClient> | null>(null);
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [hederaClient, setHederaClient] = useState<Client | null>(null);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  
  // Loan Data State
  const [fundedLoans, setFundedLoans] = useState<FundedLoan[]>([]);
  const [creditScore, setCreditScore] = useState<CreditScoreData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingRepay, setLoadingRepay] = useState<number | null>(null);
  
  // UI State
  const [showCreditScore, setShowCreditScore] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentFeedback, setPaymentFeedback] = useState<{category: string, details: string} | null>(null);

  // ==================== HEDERA CLIENT INITIALIZATION ====================
  useEffect(() => {
    const client = Client.forTestnet();
    client.setDefaultMaxTransactionFee(new Hbar(1, HbarUnit.Hbar));
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
        console.log("All accounts from session:", accounts);
        if (accounts.length > 0) {
          // Try to extract account ID from the session
          // Format can be: "hedera:testnet:0.0.7116345" or similar
          const accountIdFromSession = accounts[0].split(":")[2];
          console.log("Extracted account ID from session:", accountIdFromSession);
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

        console.log("All accounts from new session:", accounts);
        const newAccountId = accounts[0].split(":")[2];
        console.log("Extracted new account ID:", newAccountId);
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
    setCreditScore(null);
    setFundedLoans([]);
  };

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

  // Get full loan details from contract
  const getLoanDetails = async (loanId: number): Promise<FundedLoan | null> => {
    try {
      const functionSelector = '504006ca'; // getLoan(uint256)
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
        console.error(`Failed to get loan details for ${loanId}`);
        return null;
      }

      const result = await response.json();
      
      if (result.result) {
        const resultHex = result.result.startsWith('0x') ? result.result.substring(2) : result.result;
        
        // Parse loan struct fields (each 32 bytes)
        const borrowerHex = '0x' + resultHex.substring(24, 64); // Skip padding, get last 20 bytes
        const lenderHex = '0x' + resultHex.substring(88, 128);
        const loanAmountHex = resultHex.substring(128, 192);
        const interestHex = resultHex.substring(192, 256);
        const deadlineHex = resultHex.substring(256, 320);
        const statusHex = resultHex.substring(320, 384);
        const createdAtHex = resultHex.substring(384, 448);

        const borrower = hexToAccountId(borrowerHex);
        const lender = hexToAccountId(lenderHex);
        const loanAmount = BigInt('0x' + loanAmountHex).toString();
        const interest = BigInt('0x' + interestHex).toString();
        const deadline = parseInt(deadlineHex, 16);
        const status = parseInt(statusHex, 16);
        const createdAt = parseInt(createdAtHex, 16);

        return {
          loanId,
          borrower,
          lender,
          loanAmount,
          interest,
          deadline,
          status,
          createdAt,
          fundedAt: Date.now() / 1000
        };
      }

      return null;
    } catch (error) {
      console.error(`Error getting loan details for ${loanId}:`, error);
      return null;
    }
  };

  // ==================== FETCH FUNDED LOANS ====================
  const fetchFundedLoans = useCallback(async (): Promise<void> => {
    if (!accountId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch LoanFunded events from Hedera Mirror Node
      // Event signature: LoanFunded(uint256,address,uint256)
      const eventSignature = '0xbd7ef6c6281278f6c8ac4ae9ef2f205b52425813c288dd47c377cb6b59c5076e';
      
      const nowSeconds = Math.floor(Date.now() / 1000);
      const sixDaysAgoSeconds = nowSeconds - (6 * 24 * 60 * 60);
      
      const startTime = `${sixDaysAgoSeconds}.000000000`;
      const endTime = `${nowSeconds}.999999999`;
      
      const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${CONTRACT_ID}/results/logs?topic0=${eventSignature}&timestamp=gte:${startTime}&timestamp=lte:${endTime}&order=desc&limit=100`;
      
      console.log('Fetching LoanFunded events from:', mirrorNodeUrl);

      const eventsResponse = await fetch(mirrorNodeUrl);

      if (!eventsResponse.ok) {
        const errorText = await eventsResponse.text();
        console.error('Mirror node error:', errorText);
        throw new Error(`Failed to fetch funded loan events: ${eventsResponse.status}`);
      }

      const eventsData = await eventsResponse.json();
      console.log('LoanFunded events data:', eventsData);

      const loans: FundedLoan[] = [];

      if (eventsData.logs && eventsData.logs.length > 0) {
        for (const log of eventsData.logs) {
          try {
            const topics = log.topics || [];
            
            if (topics.length >= 3) {
              // Extract loanId from topic 1
              const loanIdHex = topics[1];
              const loanId = parseInt(loanIdHex, 16);

              console.log(`Processing funded loan ${loanId}`);

              // Get full loan details from contract
              const loanDetails = await getLoanDetails(loanId);

              if (loanDetails) {
                console.log(`Loan ${loanId} details:`, loanDetails);
                console.log(`Comparing borrower "${loanDetails.borrower}" with accountId "${accountId}"`);
                console.log(`Status: ${loanDetails.status}, isFunded: ${loanDetails.status === 1}`);
                
                // Only include loans where current user is the borrower and status is Funded (1)
                if (loanDetails.borrower === accountId && loanDetails.status === 1) {
                  loans.push({
                    ...loanDetails,
                    fundedAt: log.timestamp ? Math.floor(new Date(log.timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000)
                  });
                  console.log(`✅ Added loan ${loanId} to repayment list`);
                } else {
                  console.log(`❌ Skipped loan ${loanId} - Borrower match: ${loanDetails.borrower === accountId}, Status match: ${loanDetails.status === 1}`);
                }
              }
            }
          } catch (eventError) {
            console.error('Error processing funded loan event:', eventError, log);
          }
        }
      }

      console.log(`Successfully processed ${loans.length} loans to repay for user ${accountId}`);
      setFundedLoans(loans);

      // Fetch credit score for current user
      if (accountId) {
        try {
          const creditResponse = await fetch(`${API_URL}/credit-score/${accountId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          const creditData = await creditResponse.json();
          if (creditData.status === 'success' && creditData.creditScore) {
            setCreditScore(creditData.creditScore);
          } else {
            setCreditScore({
              current_score: 300,
              total_loans: 0,
              on_time_payments: 0,
              early_payments: 0,
              late_payments: 0
            });
          }
        } catch (creditError) {
          console.error('Error fetching credit score:', creditError);
          setCreditScore({
            current_score: 300,
            total_loans: 0,
            on_time_payments: 0,
            early_payments: 0,
            late_payments: 0
          });
        }
      }

    } catch (error) {
      console.error("Error fetching funded loans:", error);
      setError("Failed to fetch your loans. Please try again.");
      setFundedLoans([]);
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  // Fetch loans when wallet connects
  useEffect(() => {
    if (accountId) {
      fetchFundedLoans();
    }
  }, [accountId, fetchFundedLoans]);

  // ==================== REPAY LOAN SMART CONTRACT ====================
  const repayLoanOnContract = async (loanId: number, totalAmount: string): Promise<string> => {
    if (!signClient || !session || !accountId || !hederaClient) {
      throw new Error("Wallet not connected or Hedera client not initialized");
    }

    try {
      const accountIdObj = AccountId.fromString(accountId);
      const transactionId = TransactionId.generate(accountIdObj);

      console.log("Repaying loan with params:", { loanId, totalAmount });

      const params = new ContractFunctionParameters().addUint256(loanId);

      // Convert amount to HBAR (totalAmount is in tinybar from contract)
      const amountInHbar = new Hbar(parseInt(totalAmount) / 100000000, HbarUnit.Hbar);

      const transaction = new ContractExecuteTransaction()
        .setContractId(CONTRACT_ID)
        .setGas(1000000)
        .setFunction("repayLoan", params)
        .setPayableAmount(amountInHbar)
        .setTransactionId(transactionId);

      const frozenTx = await transaction.freezeWith(hederaClient);
      const txBytes = frozenTx.toBytes();

      // Try different wallet formats
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

        console.log("Transaction result:", result);
        return typeof result === 'string' ? result : JSON.stringify(result);
      } catch (firstError) {
        console.log("Trying alternative format...", firstError);

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

        return typeof result === 'string' ? result : JSON.stringify(result);
      }
    } catch (error) {
      console.error("Error executing repay loan transaction:", error);
      throw error;
    }
  };

  // ==================== REPAY LOAN HANDLER ====================
  const repayLoan = useCallback(async (loan: FundedLoan): Promise<void> => {
    if (!accountId) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setError(null);
      setTxHash(null);
      setPaymentFeedback(null);
      setLoadingRepay(loan.loanId);

      console.log("Repaying loan on smart contract...");

      // Calculate total repayment (loan amount + interest)
      const totalAmount = (BigInt(loan.loanAmount) + BigInt(loan.interest)).toString();

      const txResult = await repayLoanOnContract(loan.loanId, totalAmount);

      console.log("Smart contract transaction result:", txResult);

      let transactionData;
      try {
        transactionData = typeof txResult === 'string' ? JSON.parse(txResult) : txResult;
      } catch (e) {
        transactionData = { transactionId: txResult };
      }

      // Determine payment timing
      const now = Math.floor(Date.now() / 1000);
      const daysUntilDeadline = (loan.deadline - now) / (60 * 60 * 24);
      
      let category = 'on_time';
      let details = 'Good! Repaid with time to spare (+35 credit points)';
      
      if (daysUntilDeadline > 7) {
        category = 'early';
        details = 'Excellent! Early repayment (+50 credit points)';
      } else if (daysUntilDeadline < 0) {
        category = 'late';
        details = 'Warning: Late payment (-50 credit points)';
      }

      setPaymentFeedback({ category, details });

      // Update API
      try {
        await fetch(`${API_URL}/repay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loanId: loan.loanId,
            borrowerId: accountId,
            transactionId: transactionData.transactionId || txResult,
            paymentCategory: category
          })
        });
      } catch (apiError) {
        console.warn("API error but smart contract succeeded:", apiError);
      }

      setTxHash(transactionData.transactionId || txResult);
      
      // Refresh data
      setTimeout(() => {
        fetchFundedLoans();
      }, 3000);

    } catch (error) {
      console.error("Error repaying loan:", error);
      setError(error instanceof Error ? error.message : "Failed to repay loan. Please try again.");
    } finally {
      setLoadingRepay(null);
    }
  }, [accountId, fetchFundedLoans]);

  // ==================== UTILITY FUNCTIONS ====================
  const formatDate = useCallback((timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  }, []);

  const formatAmount = useCallback((amount: string): string => {
    const amountNum = parseInt(amount);
    return amountNum.toLocaleString();
  }, []);

  const tinybarsToHbar = useCallback((tinybars: string): string => {
    return (parseInt(tinybars) / 100000000).toFixed(4);
  }, []);

  const daysRemaining = useCallback((deadline: number): number => {
    const now = Math.floor(Date.now() / 1000);
    const diffSeconds = deadline - now;
    return Math.ceil(diffSeconds / (60 * 60 * 24));
  }, []);

  const isDeadlineExpired = useCallback((deadline: number): boolean => {
    return deadline < Math.floor(Date.now() / 1000);
  }, []);

  const getCreditScoreColor = useCallback((score: number): string => {
    if (score >= 750) return 'text-green-600';
    if (score >= 650) return 'text-blue-600';
    if (score >= 550) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  const getCreditScoreLabel = useCallback((score: number): string => {
    if (score >= 750) return 'Excellent';
    if (score >= 650) return 'Good';
    if (score >= 550) return 'Fair';
    return 'Poor';
  }, []);

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen mt-3 text-gray-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 p-4 pt-5 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent mb-4">
              Loans to Repay
            </h1>
            <p className="text-gray-600 text-lg">Manage your active loans and maintain your credit score</p>
          </div>

          {/* Wallet Connection */}
          {!accountId ? (
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-xl font-semibold mb-4 text-orange-600">Connect Wallet</h2>
              <button
                onClick={connectWalletConnect}
                disabled={isWalletConnecting || !signClient}
                className="group flex items-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50"
              >
                {isWalletConnecting ? "Connecting..." : "Connect WalletConnect"}
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 backdrop-blur-xl border border-green-200 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-green-700 font-semibold">Wallet Connected</p>
                  <p className="text-gray-600 text-sm">
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
            <p className="text-gray-600 text-sm break-all mb-3">Transaction ID: {txHash}</p>
            
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
        {accountId && creditScore && (
          <div className="mb-8 bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                <h3 className="text-2xl font-bold text-gray-800">Credit Score</h3>
              </div>
              <button
                onClick={() => setShowCreditScore(!showCreditScore)}
                className="bg-gradient-to-r from-orange-600 to-orange-600 hover:from-orange-700 hover:to-orange-700 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                {showCreditScore ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <span className={`text-4xl font-bold ${getCreditScoreColor(creditScore.current_score)}`}>
                  {creditScore.current_score}
                </span>
              </div>
              <div className={`px-4 py-2 rounded-xl font-medium border ${
                creditScore.current_score >= 750 ? 'bg-green-50 text-green-700 border-green-200' :
                creditScore.current_score >= 650 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                creditScore.current_score >= 550 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-red-50 text-red-700 border-red-200'
              }`}>
                {getCreditScoreLabel(creditScore.current_score)}
              </div>
            </div>

            <div className={`transition-all duration-500 ease-in-out ${showCreditScore ? 'mb-6' : 'mb-0'}`}>
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden transition-all duration-500 ease-in-out transform ${
                showCreditScore ? 'opacity-100 max-h-96 scale-100' : 'opacity-0 max-h-0 scale-95 pointer-events-none'
              }`}>
                <div className="bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4 text-center">
                  <div className="text-sm font-semibold text-gray-600 mb-2">Total Loans</div>
                  <div className="text-2xl font-bold text-zinc-700">{creditScore.total_loans}</div>
                </div>
                <div className="bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4 text-center">
                  <div className="text-sm font-semibold text-gray-600 mb-2">On Time</div>
                  <div className="text-2xl font-bold text-green-600">{creditScore.on_time_payments}</div>
                </div>
                <div className="bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4 text-center">
                  <div className="text-sm font-semibold text-gray-600 mb-2">Early</div>
                  <div className="text-2xl font-bold text-zinc-700">{creditScore.early_payments}</div>
                </div>
                <div className="bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4 text-center">
                  <div className="text-sm font-semibold text-gray-600 mb-2">Late</div>
                  <div className="text-2xl font-bold text-red-600">{creditScore.late_payments}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Credit Score Guide */}
        {accountId && <CreditScoreGuide />}

        {/* Main Content - Loans to Repay */}
        <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
            <h2 className="text-3xl font-bold text-gray-800">Your Active Loans</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
            {accountId && (
              <button
                onClick={fetchFundedLoans}
                disabled={isLoading}
                className="text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-lg transition-all duration-300"
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            )}
          </div>

          {!accountId ? (
            <div className="text-center py-16 bg-gray-100/60 rounded-2xl">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-3xl">🔗</span>
              </div>
              <p className="text-gray-700 text-xl">Connect your wallet to view loans</p>
              <p className="text-gray-500 mt-2">Access your loan repayment dashboard</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-400 rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2" style={{animationDirection: 'reverse'}}></div>
              </div>
              <p className="text-gray-600 text-lg">Loading your loans...</p>
            </div>
          ) : fundedLoans.length === 0 ? (
            <div className="text-center py-16 bg-gray-100/60 rounded-2xl">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-3xl">✅</span>
              </div>
              <p className="text-gray-700 text-xl">No active loans to repay</p>
              <p className="text-gray-500 mt-2">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {fundedLoans.map((loan, index) => {
                const totalToRepay = BigInt(loan.loanAmount) + BigInt(loan.interest);
                const isExpired = isDeadlineExpired(loan.deadline);
                const daysLeft = daysRemaining(loan.deadline);
                
                return (
                  <div 
                    key={`${loan.loanId}-${index}`}
                    className={`group backdrop-blur-xl border rounded-2xl p-6 transition-all duration-500 transform hover:scale-[1.02] ${
                      isExpired 
                        ? 'bg-gradient-to-r from-red-50/80 to-red-100/80 border-red-300 hover:border-red-400 hover:shadow-2xl' 
                        : 'bg-gradient-to-r from-white/80 to-gray-50/80 border-gray-200 hover:border-orange-300 hover:shadow-2xl'
                    }`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      {/* Lender Info */}
                      <div className="lg:col-span-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                            {loan.lender.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Lender</p>
                            <p className="text-gray-800 font-mono text-sm">
                              {loan.lender.length > 16 
                                ? `${loan.lender.substring(0, 8)}...${loan.lender.substring(loan.lender.length - 8)}`
                                : loan.lender
                              }
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
                            <p className="text-gray-500 text-sm mb-1">Total to Repay</p>
                            <p className="text-xl font-bold text-purple-600">
                              {formatAmount(totalToRepay.toString())} <span className="text-sm text-gray-500">HBAR</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Deadline Status */}
                      <div className="lg:col-span-3">
                        <div className="text-center">
                          <p className="text-gray-500 text-sm mb-1">Deadline</p>
                          <p className="text-gray-800 text-sm mb-2">{formatDate(loan.deadline)}</p>
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
                          disabled={loadingRepay === loan.loanId}
                          className={`w-full px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                            isExpired 
                              ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white' 
                              : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white'
                          }`}
                        >
                          {loadingRepay === loan.loanId ? (
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
                      <p className="text-xs text-gray-400 font-mono">
                        Loan ID: #{loan.loanId}
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

export default LoanToBeRepaid;
