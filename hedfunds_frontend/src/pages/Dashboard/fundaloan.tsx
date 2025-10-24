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
type LoanRequest = {
  loanId: number;
  borrower: string;
  lender: string;
  loanAmount: string;
  interest: string;
  deadline: number;
  status: number;
  createdAt: number;
};

type CreditScoreData = {
  current_score: number;
  total_loans: number;
  on_time_payments: number;
  early_payments: number;
  late_payments: number;
};

// ==================== MAIN COMPONENT ====================
const FundLoan: React.FC = () => {
  // WalletConnect State
  const [signClient, setSignClient] = useState<InstanceType<typeof SignClient> | null>(null);
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [hederaClient, setHederaClient] = useState<Client | null>(null);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  
  // Loan Data State
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [creditScores, setCreditScores] = useState<Map<string, CreditScoreData>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingFund, setLoadingFund] = useState<number | null>(null);
  
  // Status State
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setCreditScores(new Map());
    setLoanRequests([]);
  };

  // ==================== FETCH LOAN REQUESTS FROM BLOCKCHAIN ====================
  const fetchLoanRequests = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch LoanRequested events from Hedera Mirror Node
      // Event signature: LoanRequested(uint256,address,uint256,uint256,uint256)
      const eventSignature = '0xf6cc19e46a340ab5888d736bfc79aef72ae92d12d7b76319d72b0abc170868e6';
      
      // Calculate timestamp range (last 6 days to be safe - Mirror Node limit is 7d)
      // Hedera Mirror Node uses nanoseconds format: seconds.nanoseconds
      const nowSeconds = Math.floor(Date.now() / 1000);
      const sixDaysAgoSeconds = nowSeconds - (6 * 24 * 60 * 60);
      
      // Format timestamps as seconds.nanoseconds (e.g., 1234567890.000000000)
      const startTime = `${sixDaysAgoSeconds}.000000000`;
      const endTime = `${nowSeconds}.999999999`;
      
      // Format: timestamp=gte:START&timestamp=lte:END
      const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${CONTRACT_ID}/results/logs?topic0=${eventSignature}&timestamp=gte:${startTime}&timestamp=lte:${endTime}&order=desc&limit=100`;
      
      console.log('Fetching loan events from:', mirrorNodeUrl);

      const eventsResponse = await fetch(mirrorNodeUrl);

      if (!eventsResponse.ok) {
        const errorText = await eventsResponse.text();
        console.error('Mirror node error:', errorText);
        throw new Error(`Failed to fetch loan events from mirror node: ${eventsResponse.status}`);
      }

      const eventsData = await eventsResponse.json();
      console.log('LoanRequested events data:', eventsData);

      const loans: LoanRequest[] = [];
      const creditScoreMap = new Map<string, CreditScoreData>();
      const processedBorrowers = new Set<string>();

      // Process each LoanRequested event
      if (eventsData.logs && eventsData.logs.length > 0) {
        for (const log of eventsData.logs) {
          try {
            // Parse event data from Hashscan structure
            // Topic 0: Event signature (already filtered)
            // Topic 1: loanId (indexed)
            // Topic 2: borrower address (indexed)
            // Data: loanAmount, interest, deadline (non-indexed)
            
            const topics = log.topics || [];
            const data = log.data;

            if (topics.length >= 3 && data) {
              // Extract loanId from topic 1 (hex string)
              const loanIdHex = topics[1];
              const loanId = parseInt(loanIdHex, 16);

              // Extract borrower address from topic 2
              // The address is in hex format, we need to convert to Hedera account ID
              const borrowerHex = topics[2];
              const borrowerAccountId = hexToAccountId(borrowerHex);

              // Parse data field (contains loanAmount, interest, deadline)
              // The data might be base64 encoded, let's check and decode if needed
              let dataHex = data;
              
              // If data is base64 encoded, decode it first
              if (!data.startsWith('0x')) {
                try {
                  const decoded = atob(data);
                  dataHex = '0x' + Array.from(decoded).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
                } catch (e) {
                  console.warn('Failed to decode base64 data, assuming hex:', e);
                }
              }
              
              // Remove '0x' prefix if present
              dataHex = dataHex.startsWith('0x') ? dataHex.substring(2) : dataHex;
              
              console.log('Data hex length:', dataHex.length, 'Data:', dataHex);
              
              // Each parameter is 32 bytes (64 hex characters)
              const loanAmountHex = dataHex.substring(0, 64);
              const interestHex = dataHex.substring(64, 128);
              const deadlineHex = dataHex.substring(128, 192);

              console.log('Parsing amounts:', {
                loanAmountHex,
                interestHex,
                deadlineHex
              });

              const loanAmount = loanAmountHex ? BigInt('0x' + loanAmountHex).toString() : '0';
              const interest = interestHex ? BigInt('0x' + interestHex).toString() : '0';
              const deadline = deadlineHex ? parseInt(deadlineHex, 16) : 0;

              console.log('Parsed values:', {
                loanAmount,
                interest,
                deadline,
                deadlineDate: new Date(deadline * 1000).toISOString()
              });

              console.log(`Parsed loan ${loanId}:`, {
                borrower: borrowerAccountId,
                loanAmount,
                interest,
                deadline: new Date(deadline * 1000).toISOString()
              });

              // Check if loan is still active by querying contract
              const isActive = await checkLoanStatus(loanId);
              
              console.log(`Loan ${loanId} active status:`, isActive);

              if (isActive) {
                loans.push({
                  loanId,
                  borrower: borrowerAccountId,
                  lender: '0.0.0',
                  loanAmount,
                  interest,
                  deadline,
                  status: 0,
                  createdAt: log.timestamp ? Math.floor(new Date(log.timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000),
                });

                // Fetch credit score for borrower (only once per borrower)
                if (!processedBorrowers.has(borrowerAccountId)) {
                  processedBorrowers.add(borrowerAccountId);
                  
                  try {
                    const creditResponse = await fetch(`${API_URL}/credit-score/${borrowerAccountId}`, {
                      method: 'GET',
                      headers: { 'Content-Type': 'application/json' },
                    });

                    const creditData = await creditResponse.json();
                    if (creditData.status === 'success' && creditData.creditScore) {
                      creditScoreMap.set(borrowerAccountId, creditData.creditScore);
                    } else {
                      creditScoreMap.set(borrowerAccountId, {
                        current_score: 300,
                        total_loans: 0,
                        on_time_payments: 0,
                        early_payments: 0,
                        late_payments: 0
                      });
                    }
                  } catch (creditError) {
                    console.error(`Error fetching credit score for ${borrowerAccountId}:`, creditError);
                    creditScoreMap.set(borrowerAccountId, {
                      current_score: 300,
                      total_loans: 0,
                      on_time_payments: 0,
                      early_payments: 0,
                      late_payments: 0
                    });
                  }
                }
              }
            }
          } catch (eventError) {
            console.error('Error processing loan event:', eventError, log);
          }
        }
      }

      console.log(`Successfully processed ${loans.length} active loans`);
      setLoanRequests(loans);
      setCreditScores(creditScoreMap);

    } catch (error) {
      console.error("Error fetching loan requests from blockchain:", error);
      setError("Failed to fetch loan requests from blockchain. Please try again.");
      setLoanRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==================== HELPER FUNCTIONS ====================
  // Convert hex address to Hedera account ID
  const hexToAccountId = (hex: string): string => {
    try {
      // Remove '0x' prefix if present
      let cleanHex = hex.startsWith('0x') ? hex.substring(2) : hex;
      
      console.log('Converting hex to account ID:', { original: hex, cleaned: cleanHex });
      
      // Ensure we have a valid hex string (pad to even length if needed)
      if (cleanHex.length % 2 !== 0) {
        cleanHex = '0' + cleanHex;
      }
      
      // Remove leading zeros but keep at least one digit
      const trimmedHex = cleanHex.replace(/^0+/, '') || '0';
      
      console.log('Trimmed hex:', trimmedHex);
      
      // For large numbers, parse as BigInt and convert to string without scientific notation
      const bigIntValue = BigInt('0x' + trimmedHex);
      const accountNum = bigIntValue.toString(10); // Explicitly use base 10
      
      console.log('Account number:', accountNum);
      
      // Return in Hedera account ID format (shard.realm.num)
      return `0.0.${accountNum}`;
    } catch (error) {
      console.error('Error converting hex to account ID:', hex, error);
      return '0.0.0';
    }
  };

  // Check if loan is still active (status = 0 = Pending)
  const checkLoanStatus = async (loanId: number): Promise<boolean> => {
    try {
      // Use the getLoan view function from the contract to get full loan details
      // Function selector: 0x504006ca for getLoan(uint256)
      const functionSelector = '504006ca';
      const paddedLoanId = loanId.toString(16).padStart(64, '0');
      const callData = '0x' + functionSelector + paddedLoanId;

      console.log(`Checking loan ${loanId} status with callData:`, callData);

      // Convert contract ID to hex address format for Mirror Node
      // CONTRACT_ID is "0.0.7091233" -> convert to hex
      const contractIdParts = CONTRACT_ID.split('.');
      const contractNum = parseInt(contractIdParts[2]);
      const contractHex = '0x' + contractNum.toString(16).padStart(40, '0');

      console.log(`Contract hex for loan ${loanId}:`, contractHex);

      const requestBody = {
        data: callData,
        to: contractHex,
        estimate: false,
        gas: 100000
      };

      console.log(`Request body for loan ${loanId}:`, JSON.stringify(requestBody, null, 2));

      const response = await fetch(
        'https://testnet.mirrornode.hedera.com/api/v1/contracts/call',
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to check status for loan ${loanId}:`, errorText);
        console.log(`Failed request details:`, { contractHex, callData, contractIdParts });
        return true; // Assume active if check fails
      }

      const result = await response.json();
      console.log(`Raw result for loan ${loanId}:`, result);
      
      // Parse the loan struct to check status
      // getLoan returns: (address borrower, address lender, uint256 loanAmount, uint256 interest, uint256 deadline, uint8 status, uint256 createdAt)
      // Each field is 32 bytes (64 hex chars):
      // 0-63: borrower (32 bytes)
      // 64-127: lender (32 bytes)
      // 128-191: loanAmount (32 bytes)
      // 192-255: interest (32 bytes)
      // 256-319: deadline (32 bytes)
      // 320-383: status (32 bytes, but uint8 so only last 2 hex chars matter)
      // 384-447: createdAt (32 bytes)
      
      if (result.result) {
        const resultHex = result.result.startsWith('0x') ? result.result.substring(2) : result.result;
        
        console.log(`Result hex length for loan ${loanId}:`, resultHex.length);
        
        // Status field starts at byte 160 (5 * 32 bytes)
        const statusHex = resultHex.substring(320, 384);
        const status = parseInt(statusHex, 16);
        
        console.log(`Loan ${loanId} status hex: ${statusHex}, parsed status: ${status}`);
        
        // Status 0 = Pending (active), Status 1 = Funded, Status 2 = Repaid, Status 3 = Defaulted
        const isActive = status === 0;
        console.log(`Loan ${loanId} is ${isActive ? 'ACTIVE' : 'NOT ACTIVE'} (status: ${status})`);
        
        return isActive;
      }

      // If no result, assume active
      console.warn(`No result returned for loan ${loanId}, assuming active`);
      return true;
    } catch (error) {
      console.error(`Error checking loan status for ${loanId}:`, error);
      return true; // Assume active if check fails
    }
  };

  // Fetch loans on component mount and when wallet connects
  useEffect(() => {
    fetchLoanRequests();
  }, [fetchLoanRequests]);

  // ==================== FUND LOAN SMART CONTRACT ====================
  const fundLoanOnContract = async (loanId: number, loanAmount: string): Promise<string> => {
    if (!signClient || !session || !accountId || !hederaClient) {
      throw new Error("Wallet not connected or Hedera client not initialized");
    }

    try {
      const accountIdObj = AccountId.fromString(accountId);
      const transactionId = TransactionId.generate(accountIdObj);

      console.log("Generated Transaction ID:", transactionId.toString());
      console.log("Funding loan with params:", { loanId, loanAmount });

      // Create contract function parameters for fundLoan(uint256 _loanId)
      const params = new ContractFunctionParameters().addUint256(loanId);

      // Calculate amount in tinybar (Hedera's smallest unit)
      // loanAmount is already in tinybar from the contract
      const amountInHbar = new Hbar(parseInt(loanAmount) / 100000000, HbarUnit.Hbar);

      // Create the transaction with payable amount
      const transaction = new ContractExecuteTransaction()
        .setContractId(CONTRACT_ID)
        .setGas(1000000)
        .setFunction("fundLoan", params)
        .setPayableAmount(amountInHbar)
        .setTransactionId(transactionId);

      console.log("Transaction before freeze:", transaction.toString());

      // Freeze the transaction
      const frozenTx = await transaction.freezeWith(hederaClient);
      const txBytes = frozenTx.toBytes();

      console.log("Transaction bytes length:", txBytes.length);
      console.log("Sending request to WalletConnect with topic:", session.topic);

      // Try different wallet formats (Kabila, HashPack, Blade)
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

        console.log("Transaction result (Kabila format):", result);
        return typeof result === 'string' ? result : JSON.stringify(result);
      } catch (firstError) {
        console.log("Kabila format failed, trying HashPack format...", firstError);

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

          console.log("Transaction result (HashPack format):", result);
          return typeof result === 'string' ? result : JSON.stringify(result);
        } catch (secondError) {
          console.log("HashPack format failed, trying Blade format...", secondError);

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

          console.log("Transaction result (Blade format):", result);
          return typeof result === 'string' ? result : JSON.stringify(result);
        }
      }
    } catch (error) {
      console.error("Error executing fund loan transaction:", error);
      throw error;
    }
  };

  // ==================== FUND LOAN HANDLER ====================
  const fundLoan = useCallback(async (loan: LoanRequest): Promise<void> => {
    if (!accountId) {
      setError("Please connect your wallet first");
      return;
    }

    // Prevent self-funding
    if (accountId === loan.borrower) {
      setError("You cannot fund your own loan request");
      return;
    }

    try {
      setError(null);
      setTxHash(null);
      setLoadingFund(loan.loanId);

      console.log("Funding loan on smart contract...");

      // Call smart contract function
      const txResult = await fundLoanOnContract(loan.loanId, loan.loanAmount);

      console.log("Smart contract transaction result:", txResult);

      // Parse transaction result
      let transactionData;
      try {
        transactionData = typeof txResult === 'string' ? JSON.parse(txResult) : txResult;
      } catch (e) {
        transactionData = { transactionId: txResult };
      }

      // Update API (optional - for tracking)
      try {
        const response = await fetch(`${API_URL}/fund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            loanId: loan.loanId,
            lenderId: accountId,
            transactionId: transactionData.transactionId || txResult,
            transactionHash: transactionData.transactionHash || null,
          })
        });

        if (!response.ok) {
          console.warn("API call failed but smart contract succeeded:", await response.text());
        }
      } catch (apiError) {
        console.warn("API error but smart contract succeeded:", apiError);
      }

      setTxHash(transactionData.transactionId || txResult);
      
      // Refresh loan data after successful funding (wait 3 seconds for blockchain to update)
      setTimeout(() => {
        console.log('Refreshing loan list after successful funding...');
        fetchLoanRequests();
      }, 3000);

    } catch (error) {
      console.error("Error funding loan:", error);
      setError(error instanceof Error ? error.message : "Failed to fund loan. Please try again.");
    } finally {
      setLoadingFund(null);
    }
  }, [accountId, fetchLoanRequests]);

  // ==================== UTILITY FUNCTIONS ====================
  const formatDate = useCallback((timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  }, []);

  const formatAmount = useCallback((amount: string): string => {
    // The contract stores amounts as plain integers (e.g., 40000, 10000)
    // Not in tinybar, so we just format them directly
    const amountNum = parseInt(amount);
    return amountNum.toLocaleString();
  }, []);

  const daysRemaining = useCallback((deadline: number): number => {
    const now = Math.floor(Date.now() / 1000);
    const diffSeconds = deadline - now;
    return Math.ceil(diffSeconds / (60 * 60 * 24));
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

  const getCreditScoreBg = useCallback((score: number): string => {
    if (score >= 750) return 'bg-green-50 border-green-200';
    if (score >= 650) return 'bg-blue-50 border-blue-200';
    if (score >= 550) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent mb-4">
              Fund Loans
            </h1>
            <p className="text-gray-600 text-lg">Discover and fund promising loan opportunities on Hedera</p>
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
              <p className="text-green-700 font-semibold">Loan Funded Successfully!</p>
            </div>
            <p className="text-gray-600 text-sm break-all">Transaction ID: {txHash}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
            <h2 className="text-3xl font-bold text-gray-800">Active Loan Requests</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
            <button
              onClick={fetchLoanRequests}
              disabled={isLoading}
              className="text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-lg transition-all duration-300"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-400 rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2" style={{animationDirection: 'reverse'}}></div>
              </div>
              <p className="text-gray-600 text-lg">Loading loan requests...</p>
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
                const creditScore = creditScores.get(loan.borrower);
                const isOwnLoan = accountId === loan.borrower;
                
                return (
                  <div 
                    key={`${loan.loanId}-${index}`}
                    className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 hover:border-orange-300 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]"
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
                                ? `${loan.borrower.substring(0, 8)}...${loan.borrower.substring(loan.borrower.length - 8)}`
                                : loan.borrower
                              }
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
                              disabled={!accountId || loadingFund === loan.loanId}
                              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              {loadingFund === loan.loanId ? (
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

export default FundLoan;
