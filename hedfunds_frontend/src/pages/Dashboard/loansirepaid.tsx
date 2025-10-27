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
const API_URL = "https://swiftfund-6b61.onrender.com/api/loans";

// ==================== TYPE DEFINITIONS ====================
type RepaidLoan = {
  loanId: number;
  borrower: string;
  lender: string;
  loanAmount: string;
  interest: string;
  deadline: number;
  repaidAt: number;
  repaymentTxHash: string;
  paymentCategory?: string;
  daysEarlyLate?: number;
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
const LoansIRepaid: React.FC = () => {
  // WalletConnect State
  const [signClient, setSignClient] = useState<InstanceType<typeof SignClient> | null>(null);
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  
  // Loan Data State
  const [repaidLoans, setRepaidLoans] = useState<RepaidLoan[]>([]);
  const [creditScore, setCreditScore] = useState<CreditScoreData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // UI State
  const [showCreditScore, setShowCreditScore] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setCreditScore(null);
    setRepaidLoans([]);
  };

  // ==================== HELPER FUNCTIONS ====================
  const getLoanDetails = async (loanId: number): Promise<RepaidLoan | null> => {
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
        
        const borrowerHex = '0x' + resultHex.substring(24, 64);
        const lenderHex = '0x' + resultHex.substring(88, 128);
        
        const loanAmountHex = resultHex.substring(128, 192);
        const interestHex = resultHex.substring(192, 256);
        const deadlineHex = resultHex.substring(256, 320);
        const statusHex = resultHex.substring(320, 384);

        // Convert addresses
        let borrower = borrowerHex;
        const cleanBorrowerHex = borrowerHex.startsWith('0x') ? borrowerHex.substring(2) : borrowerHex;
        
        if (cleanBorrowerHex.match(/^0{24,}/)) {
          const trimmed = cleanBorrowerHex.replace(/^0+/, '') || '0';
          borrower = `0.0.${parseInt(trimmed, 16)}`;
        } else {
          try {
            const resp = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${borrowerHex}`);
            if (resp.ok) {
              const data = await resp.json();
              if (data.account) borrower = data.account;
            }
          } catch (e) {
            console.error('Error querying borrower:', e);
          }
        }
        
        let lender = lenderHex;
        const cleanLenderHex = lenderHex.startsWith('0x') ? lenderHex.substring(2) : lenderHex;
        
        if (cleanLenderHex.match(/^0{24,}/)) {
          const trimmed = cleanLenderHex.replace(/^0+/, '') || '0';
          lender = `0.0.${parseInt(trimmed, 16)}`;
        } else {
          try {
            const resp = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${lenderHex}`);
            if (resp.ok) {
              const data = await resp.json();
              if (data.account) lender = data.account;
            }
          } catch (e) {
            console.error('Error querying lender:', e);
          }
        }
        
        const loanAmount = BigInt('0x' + loanAmountHex).toString();
        const interest = BigInt('0x' + interestHex).toString();
        const deadline = parseInt(deadlineHex, 16);
        const status = parseInt(statusHex, 16);

        return {
          loanId,
          borrower,
          lender,
          loanAmount,
          interest,
          deadline,
          repaidAt: 0,
          repaymentTxHash: '',
          paymentCategory: undefined,
          daysEarlyLate: undefined
        };
      }

      return null;
    } catch (error) {
      console.error(`Error getting loan details for ${loanId}:`, error);
      return null;
    }
  };

  // ==================== FETCH REPAID LOANS ====================
  const fetchRepaidLoans = useCallback(async (): Promise<void> => {
    if (!accountId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch LoanRepaid events from Hedera Mirror Node
      // Event signature: LoanRepaid(uint256,address,uint256)
      const eventSignature = '0x5c3f8c6a3d3f8e5d8f3e9d7c6b5a4e3d2c1b0a9f8e7d6c5b4a3e2d1c0b9a8f7e';
      
      const nowSeconds = Math.floor(Date.now() / 1000);
      const thirtyDaysAgoSeconds = nowSeconds - (30 * 24 * 60 * 60);
      
      const startTime = `${thirtyDaysAgoSeconds}.000000000`;
      const endTime = `${nowSeconds}.999999999`;
      
      const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${CONTRACT_ID}/results/logs?topic0=${eventSignature}&timestamp=gte:${startTime}&timestamp=lte:${endTime}&order=desc&limit=100`;
      
      console.log('Fetching LoanRepaid events from:', mirrorNodeUrl);

      const eventsResponse = await fetch(mirrorNodeUrl);

      if (!eventsResponse.ok) {
        const errorText = await eventsResponse.text();
        console.error('Mirror node error:', errorText);
        throw new Error(`Failed to fetch repaid loan events: ${eventsResponse.status}`);
      }

      const eventsData = await eventsResponse.json();
      console.log('LoanRepaid events data:', eventsData);

      const loans: RepaidLoan[] = [];

      if (eventsData.logs && eventsData.logs.length > 0) {
        for (const log of eventsData.logs) {
          try {
            const topics = log.topics || [];
            
            if (topics.length >= 3) {
              // Extract loanId from topic 1
              const loanIdHex = topics[1];
              const loanId = parseInt(loanIdHex, 16);

              console.log(`Processing repaid loan ${loanId}`);

              // Get full loan details from contract
              const loanDetails = await getLoanDetails(loanId);

              if (loanDetails) {
                console.log(`Loan ${loanId} details:`, loanDetails);
                console.log(`Comparing borrower "${loanDetails.borrower}" with accountId "${accountId}"`);
                
                // Only include loans where current user is the borrower
                if (loanDetails.borrower === accountId) {
                  // Calculate payment timing
                  const repaidAt = log.timestamp ? Math.floor(new Date(log.timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000);
                  const daysUntilDeadline = (loanDetails.deadline - repaidAt) / (60 * 60 * 24);
                  
                  let category = 'on_time';
                  let daysEarlyLate = 0;
                  
                  if (daysUntilDeadline > 7) {
                    category = 'early';
                    daysEarlyLate = Math.floor(daysUntilDeadline);
                  } else if (daysUntilDeadline < 0) {
                    category = 'late';
                    daysEarlyLate = Math.abs(Math.floor(daysUntilDeadline));
                  }

                  loans.push({
                    ...loanDetails,
                    repaidAt,
                    repaymentTxHash: log.transaction_hash || '',
                    paymentCategory: category,
                    daysEarlyLate
                  });
                  console.log(`✅ Added repaid loan ${loanId} to history`);
                } else {
                  console.log(`❌ Skipped loan ${loanId} - Not borrower`);
                }
              }
            }
          } catch (eventError) {
            console.error('Error processing repaid loan event:', eventError, log);
          }
        }
      }

      console.log(`Successfully processed ${loans.length} repaid loans for user ${accountId}`);
      setRepaidLoans(loans);

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
      console.error("Error fetching repaid loans:", error);
      setError("Failed to fetch your repaid loans. Please try again.");
      setRepaidLoans([]);
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  // Fetch loans when wallet connects
  useEffect(() => {
    if (accountId) {
      fetchRepaidLoans();
    }
  }, [accountId, fetchRepaidLoans]);

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

  const getPaymentTimingDisplay = (paymentCategory?: string, daysEarlyLate?: number) => {
    if (!paymentCategory) {
      return <span className="text-gray-400">N/A</span>;
    }

    const days = Math.abs(daysEarlyLate || 0);
    const daysText = days === 1 ? 'day' : 'days';

    switch (paymentCategory) {
      case 'early':
        return (
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
            <span className="text-blue-700 font-medium">Early</span>
            {days > 0 && (
              <span className="text-blue-600 text-xs ml-1">
                ({days} {daysText})
              </span>
            )}
          </div>
        );
      case 'on_time':
        return (
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            <span className="text-green-700 font-medium">On Time</span>
          </div>
        );
      case 'late':
        return (
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
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
  };

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
              Loans I Have Repaid
            </h1>
            <p className="text-gray-600 text-lg">Track your loan repayment history and credit score</p>
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

        {/* Credit Score Section */}
        {accountId && creditScore && (
          <div className="mb-8 bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                <h3 className="text-2xl font-bold text-gray-800">Credit Score Dashboard</h3>
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
                  <div className="text-2xl font-bold text-blue-600">{creditScore.early_payments}</div>
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

        {/* Main Content - Repaid Loans */}
        <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
            <h2 className="text-3xl font-bold text-gray-800">Your Repaid Loans</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
            {accountId && (
              <button
                onClick={fetchRepaidLoans}
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
              <p className="text-gray-700 text-xl">Connect your wallet to view repaid loans</p>
              <p className="text-gray-500 mt-2">Access your loan repayment history</p>
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
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-3xl">✅</span>
              </div>
              <p className="text-gray-700 text-xl">No repaid loans found</p>
              <p className="text-gray-500 mt-2">Your repayment history will appear here once you repay loans</p>
            </div>
          ) : (
            <div className="space-y-6">
              {repaidLoans.map((loan, index) => {
                const totalRepaid = BigInt(loan.loanAmount) + BigInt(loan.interest);
                
                return (
                  <div 
                    key={`${loan.loanId}-${index}`}
                    className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 hover:border-orange-300 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      {/* Repayment Date */}
                      <div className="lg:col-span-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                            ✓
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Repaid On</p>
                            <p className="text-gray-800 font-medium text-sm">
                              {formatDate(loan.repaidAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Status */}
                      <div className="lg:col-span-2">
                        <div className="p-4 rounded-xl border border-gray-200 bg-white/60">
                          <div className="text-center">
                            {getPaymentTimingDisplay(loan.paymentCategory, loan.daysEarlyLate)}
                          </div>
                        </div>
                      </div>

                      {/* Loan Details */}
                      <div className="lg:col-span-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-gray-500 text-sm mb-1">Loan Amount</p>
                            <p className="text-lg font-bold text-orange-600">
                              {formatAmount(loan.loanAmount)} <span className="text-xs text-gray-500">HBAR</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm mb-1">Interest</p>
                            <p className="text-lg font-semibold text-yellow-600">
                              {formatAmount(loan.interest)} <span className="text-xs text-gray-500">HBAR</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm mb-1">Total Repaid</p>
                            <p className="text-lg font-bold text-green-600">
                              {formatAmount(totalRepaid.toString())} <span className="text-xs text-gray-500">HBAR</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Lender & Transaction */}
                      <div className="lg:col-span-3">
                        <div className="text-right">
                          <p className="text-gray-500 text-sm mb-1">Lender</p>
                          <p className="text-gray-800 text-sm font-mono mb-3">
                            {loan.lender.length > 16 
                              ? `${loan.lender.substring(0, 8)}...${loan.lender.substring(loan.lender.length - 8)}`
                              : loan.lender
                            }
                          </p>
                          
                          {loan.repaymentTxHash && (
                            <a 
                              href={`https://hashscan.io/testnet/transaction/${loan.repaymentTxHash}`} 
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
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Loan ID & Transaction Hash */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                        <span>Loan ID: #{loan.loanId}</span>
                        {loan.repaymentTxHash && (
                          <span>TX: {loan.repaymentTxHash.substring(0, 16)}...</span>
                        )}
                        <span>Deadline: {formatDate(loan.deadline)}</span>
                      </div>
                    </div>

                    {/* Credit Score Impact Badge */}
                    {loan.paymentCategory && (
                      <div className="mt-3">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          loan.paymentCategory === 'early' ? 'bg-blue-100 text-blue-700' :
                          loan.paymentCategory === 'on_time' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${
                            loan.paymentCategory === 'early' ? 'bg-blue-500' :
                            loan.paymentCategory === 'on_time' ? 'bg-green-500' :
                            'bg-red-500'
                          }`}></span>
                          {loan.paymentCategory === 'early' && 'Credit Score +50 points'}
                          {loan.paymentCategory === 'on_time' && 'Credit Score +35 points'}
                          {loan.paymentCategory === 'late' && 'Credit Score -50 points'}
                        </div>
                      </div>
                    )}
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