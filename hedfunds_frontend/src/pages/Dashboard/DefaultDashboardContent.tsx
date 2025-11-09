import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import RepaymentTimelineChart from './RepaymentTimelineChart';
import default_profile from "../../assets/avatar-default.png";
import { useWallet } from "./Dashboard";
import SignClient from "@walletconnect/sign-client";
import { Web3Modal } from "@web3modal/standalone";
import { getSdkError } from "@walletconnect/utils";
import { SessionTypes } from "@walletconnect/types";
import { Client } from "@hashgraph/sdk";

// ==================== CONFIGURATION ====================
const CONTRACT_ID = "0.0.7091233";
const API_BASE_URL = "https://hedfunds.onrender.com";
const WALLETCONNECT_PROJECT_ID = "cb09000e29ac8eb293421c4501e4ecb9";
const HEDERA_NETWORK = "testnet";

// ==================== TYPE DEFINITIONS ====================
type CreditScoreData = {
  current_score: number;
  total_loans: number;
  on_time_payments: number;
  early_payments: number;
  late_payments: number;
};

// ==================== UTILITY FUNCTIONS ====================
function shortenAddress(address: string, start = 6, end = 4) {
  if (!address) return "";
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

// ==================== MAIN COMPONENT ====================
const DefaultDashboardContent: React.FC = () => {
  const { connection } = useWallet();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // WalletConnect State
  const [signClient, setSignClient] = useState<InstanceType<typeof SignClient> | null>(null);
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);
  const [walletAccountId, setWalletAccountId] = useState<string | null>(null);
  const [hederaClient, setHederaClient] = useState<Client | null>(null);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);

  // State
  const [hbarToNgnRate, setHbarToNgnRate] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>("0");
  const [activeLoans, setActiveLoans] = useState<number>(0);
  const [totalApplications, setTotalApplications] = useState<number>(0);
  const [pendingApproval, setPendingApproval] = useState<number>(0);
  const [totalRepaid, setTotalRepaid] = useState<number>(0);
  const [creditScore, setCreditScore] = useState<CreditScoreData | null>(null);
  const [isCreditScoreLoading, setIsCreditScoreLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);

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
        setWalletAccountId(null);
      });

      const sessions = client.session.getAll();
      if (sessions.length > 0) {
        const lastSession = sessions[sessions.length - 1];
        setSession(lastSession);
        const accounts = lastSession.namespaces.hedera?.accounts || [];
        if (accounts.length > 0) {
          const accountIdFromSession = accounts[0].split(":")[2];
          setWalletAccountId(accountIdFromSession);
        }
      }
    } catch (error) {
      console.error("Failed to initialize WalletConnect:", error);
    }
  }, []);

  useEffect(() => {
    initializeWalletConnect();
  }, [initializeWalletConnect]);

  // ==================== WALLET CONNECTION ====================
  const connectWalletConnect = async () => {
    if (!signClient) {
      alert("WalletConnect not initialized. Please wait or refresh the page.");
      return;
    }

    try {
      setIsWalletConnecting(true);

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

        setWalletAccountId(newAccountId);
        console.log("Successfully connected to account:", newAccountId);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to connect wallet";
      alert(errorMessage);
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
    setWalletAccountId(null);
    setWalletBalance("0");
  };

  // ==================== FETCH EXCHANGE RATES ====================
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=ngn"
        );
        const data = await response.json();
        const rate = data["hedera-hashgraph"].ngn;
        setHbarToNgnRate(rate);
      } catch (error) {
        console.error("Error fetching exchange rate", error);
      }
    };

    fetchExchangeRate();
  }, []);

  // ==================== LOAD USER DATA ====================
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserName(parsedUser.fullname || "User");
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // ==================== FETCH CREDIT SCORE ====================
  const fetchCreditScore = async (accountId: string): Promise<void> => {
    try {
      setIsCreditScoreLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/loans/credit-score/${accountId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setCreditScore(data.creditScore);
      } else {
        setCreditScore({
          current_score: 600,
          total_loans: 0,
          on_time_payments: 0,
          early_payments: 0,
          late_payments: 0
        });
      }
    } catch (error) {
      console.error("Error fetching credit score:", error);
      setCreditScore({
        current_score: 600,
        total_loans: 0,
        on_time_payments: 0,
        early_payments: 0,
        late_payments: 0
      });
    } finally {
      setIsCreditScoreLoading(false);
    }
  };

  // ==================== CREDIT SCORE UTILITIES ====================
  const getCreditScoreColor = (score: number): string => {
    if (score >= 750) return 'text-green-600';
    if (score >= 650) return 'text-blue-600';
    if (score >= 550) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCreditScoreLabel = (score: number): string => {
    if (score >= 750) return 'Excellent';
    if (score >= 650) return 'Good';
    if (score >= 550) return 'Fair';
    return 'Poor';
  };

  const getCreditScoreBgColor = (score: number): string => {
    if (score >= 750) return 'bg-green-500';
    if (score >= 650) return 'bg-blue-500';
    if (score >= 550) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCreditScoreProgress = (score: number): number => {
    return Math.min((score / 850) * 100, 100);
  };

  // ==================== FETCH WALLET BALANCE ====================
  const fetchWalletBalance = async () => {
    const accountId = walletAccountId || connection?.accountId;
    if (!accountId) return;
    
    try {
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const balanceInHbar = (parseInt(data.balance.balance) / 100000000).toFixed(2);
        setWalletBalance(balanceInHbar);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  };

  // ==================== FETCH LOAN STATISTICS FROM BLOCKCHAIN ====================
  const fetchLoanStatistics = async () => {
    const accountId = walletAccountId || connection?.accountId;
    if (!accountId) return;
    
    setIsLoading(true);
    
    try {
      const eventSignature = '0xf6cc19e46a340ab5888d736bfc79aef72ae92d12d7b76319d72b0abc170868e6';
      
      const nowSeconds = Math.floor(Date.now() / 1000);
      const sixDaysAgoSeconds = nowSeconds - (6 * 24 * 60 * 60);
      
      const startTime = `${sixDaysAgoSeconds}.000000000`;
      const endTime = `${nowSeconds}.999999999`;
      
      const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${CONTRACT_ID}/results/logs?topic0=${eventSignature}&timestamp=gte:${startTime}&timestamp=lte:${endTime}&order=desc&limit=100`;
      
      const eventsResponse = await fetch(mirrorNodeUrl);
      
      if (!eventsResponse.ok) {
        throw new Error(`Failed to fetch loan events: ${eventsResponse.status}`);
      }

      const eventsData = await eventsResponse.json();
      
      let userTotalApplications = 0;
      let userPendingApprovals = 0;
      let userActiveLoans = 0;
      let userRepaidLoans = 0;

      const currentTime = Math.floor(Date.now() / 1000);
      const myAccountIdLower = accountId.toLowerCase();

      if (eventsData.logs && eventsData.logs.length > 0) {
        for (const log of eventsData.logs) {
          try {
            const topics = log.topics || [];
            const data = log.data;

            if (topics.length >= 3 && data) {
              const borrowerHex = topics[2];
              const borrowerAccountId = hexToAccountId(borrowerHex);

              if (borrowerAccountId.toLowerCase() === myAccountIdLower) {
                userTotalApplications++;

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
                const deadlineHex = dataHex.substring(128, 192);
                const deadline = deadlineHex ? parseInt(deadlineHex, 16) : 0;

                const loanIdHex = topics[1];
                const loanId = parseInt(loanIdHex, 16);

                const loanDetails = await getLoanStatus(loanId);
                
                if (loanDetails) {
                  if (loanDetails.status === 0 && deadline > currentTime) {
                    userPendingApprovals++;
                  } else if (loanDetails.status === 1) {
                    userActiveLoans++;
                  } else if (loanDetails.status === 2) {
                    userRepaidLoans++;
                  }
                }
              }
            }
          } catch (eventError) {
            console.error('Error processing loan event:', eventError);
          }
        }
      }

      setTotalApplications(userTotalApplications);
      setPendingApproval(userPendingApprovals);
      setActiveLoans(userActiveLoans);
      setTotalRepaid(userRepaidLoans);
      
    } catch (error) {
      console.error("Error fetching loan statistics:", error);
    } finally {
      setIsLoading(false);
    }
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

  const getLoanStatus = async (loanId: number): Promise<{status: number} | null> => {
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
        return null;
      }

      const result = await response.json();
      
      if (result.result) {
        const resultHex = result.result.startsWith('0x') ? result.result.substring(2) : result.result;
        const statusHex = resultHex.substring(320, 384);
        const status = parseInt(statusHex, 16);
                
        return { status };
      }

      return null;
    } catch (error) {
      console.error(`Error getting loan status for ${loanId}:`, error);
      return null;
    }
  };

  // ==================== FETCH DATA WHEN WALLET CONNECTS ====================
  useEffect(() => {
    const accountId = walletAccountId || connection?.accountId;
    if (accountId) {
      fetchWalletBalance();
      fetchLoanStatistics();
      fetchCreditScore(accountId);
    }
  }, [walletAccountId, connection?.accountId]);

  // ==================== FORMAT UTILITIES ====================
  function hbarToNgn(hbar: string): string {
    if (!hbarToNgnRate) return "0";
    return (parseFloat(hbar) * hbarToNgnRate).toFixed(2);
  }

  function formatAddress(address: string | undefined): string {
    if (!address) return "";
    return shortenAddress(address, 8, 8);
  }

  // ==================== CLOSE DROPDOWN ON OUTSIDE CLICK ====================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        event.target instanceof Node &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get the active account ID (prioritize WalletConnect, fallback to context)
  const activeAccountId = walletAccountId || connection?.accountId;

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 p-6 pt-8">

        {/* Dashboard Header */}
        <div className="mb-8">
          
          {/* Mobile Layout - Icons on top */}
          <div className="flex absolute top-0 right-0 md:hidden items-center justify-end mb-4 space-x-1">
            {/* Notification Icon */}
            <button className="relative p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-300">
              <i className="bx bx-bell text-xl"></i>
              <span className="absolute top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            </button>

            {/* Settings Icon */}
            <button className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* User Avatar */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                  <img src={default_profile} alt="User Avatar" className="w-full h-full object-cover" />
                </div>
                <button
                  className="text-gray-600 hover:text-orange-600 transition-colors duration-300"
                  onClick={() => setShowDropdown((prev) => !prev)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {showDropdown && (
                <div className="absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl z-50 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-gray-600">Signed in as</p>
                  </div>
                  <p className="font-semibold text-gray-800 mb-4">{userName || "User"}</p>
                
                  {activeAccountId && (
                    <>
                      <div className="h-px bg-gradient-to-r from-gray-300 to-transparent mb-4"></div>
                      <p className="text-sm text-gray-600 mb-2">Hedera Account:</p>
                      <div className="bg-gray-100/60 rounded-xl p-3">
                        <p className="text-xs font-mono text-orange-600 break-all">
                          {activeAccountId}
                        </p>
                      </div>
                    </>
                  )}
                </div>  
              )}
            </div>
          </div>

          {/* Welcome Section */}
          <div className="md:flex pt-10 md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                Welcome, {userName} 
              </h1>
              <p className="text-gray-600 text-sm md:text-base">Your personal loan management dashboard on Hedera</p>
            </div>

            {/* Desktop Layout - Icons on the right */}
            <div className="hidden md:flex items-center -translate-y-10 space-x-2">
              {/* Notification Icon */}
              <button className="relative p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-300">
                <i className="bx bx-bell text-xl"></i>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {/* Settings Icon */}
              <button className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* User Avatar */}
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                    <img src={default_profile} alt="User Avatar" className="w-full h-full object-cover" />
                  </div>
                  <button
                    className="text-gray-600 hover:text-orange-600 transition-colors duration-300"
                    onClick={() => setShowDropdown((prev) => !prev)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {showDropdown && (
                  <div className="absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl z-50 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-sm text-gray-600">Signed in as</p>
                    </div>
                    <p className="font-semibold text-gray-800 mb-4">{userName || "User"}</p>
                  
                    {activeAccountId && (
                      <>
                        <div className="h-px bg-gradient-to-r from-gray-300 to-transparent mb-4"></div>
                        <p className="text-sm text-gray-600 mb-2">Hedera Account:</p>
                        <div className="bg-gray-100/60 rounded-xl p-3">
                          <p className="text-xs font-mono text-orange-600 break-all">
                            {activeAccountId}
                          </p>
                        </div>
                      </>
                    )}
                  </div>  
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
          {/* Total Applications */}
          <div className="group -z-10 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Applications</h3>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-2">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
              ) : totalApplications}
            </p>
            <div className="flex items-center text-sm text-blue-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>All loan requests made</span>
            </div>
          </div>

          {/* Active Loans */}
          <div className="group -z-10 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Active Loans</h3>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-2">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
              ) : activeLoans}
            </p>
            <div className="flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Funded & not repaid</span>
            </div>
          </div>

          {/* Total Repaid */}
          <div className="group bg-white/80 -z-10 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Repaid</h3>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-2">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
              ) : totalRepaid}
            </p>
            <div className="flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Repaid Loans</span>
            </div>
          </div>
        </div>

        {/* Wallet Balance Section */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-3xl shadow-xl p-8 mb-8 max-w-5xl mx-auto"> 
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-1 h-12 bg-white/50 rounded-full"></div>
              <div>
                <h2 className="text-2xl font-bold text-white">Wallet Balance</h2>
                <div className="h-px w-24 bg-white/30 mt-2"></div>
              </div>
            </div>
            
            {activeAccountId ? (
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 hidden md:flex items-center rounded-2xl p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-white font-semibold">Wallet Connected</p>
                    <p className="text-orange-100 text-sm font-mono">
                      {activeAccountId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="ml-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm transition-all duration-300"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWalletConnect}
                disabled={isWalletConnecting || !signClient}
                className="bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isWalletConnecting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  "Connect Wallet"
                )}
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <p className="text-orange-100 text-sm mb-2">Total Balance (₦)</p> 
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                ₦ {activeAccountId ? hbarToNgn(walletBalance) : "0"}
              </h3>
            </div>

            <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <p className="text-orange-100 text-sm mb-2">Total Balance (HBAR)</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white"> 
                {activeAccountId ? walletBalance : "0"} HBAR
              </h3>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex flex-col md:flex-row gap-6 mx-auto">
          {/* Chart Section */}
          <div className="md:w-[60%] p-7 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-lg">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-800">Repayment Timeline</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
            </div>
            <RepaymentTimelineChart />
          </div>

          {/* Verification Status Section */}
          <div className="bg-white/80 md:w-[40%] backdrop-blur-sm border border-gray-200 rounded-3xl p-8 shadow-lg">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
              <h2 className="text-lg font-bold text-gray-800">Verification Status</h2>
            </div>

            {/* KYC Level Progress */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">KYC Level</span>
                <span className="text-sm font-bold text-orange-600">Level 1</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
                <div className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-1000" style={{ width: "33%" }}></div>
              </div>
              <button className="text-orange-600 text-sm font-medium hover:text-orange-700 transition-colors duration-300 flex items-center">
                Upgrade to Level 2 
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>

            {/* Credit Reputation Score */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">Credit Reputation Score</span>
                {isCreditScoreLoading ? (
                  <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                ) : (
                  <span className={`text-sm font-bold ${creditScore ? getCreditScoreColor(creditScore.current_score) : 'text-green-600'}`}>
                    {creditScore ? creditScore.current_score : "600"}
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${creditScore ? getCreditScoreBgColor(creditScore.current_score) : 'bg-gradient-to-r from-green-500 to-green-400'}`} 
                  style={{ width: `${creditScore ? getCreditScoreProgress(creditScore.current_score) : 10}%` }}
                ></div>
              </div>
              <div className={`${creditScore && creditScore.current_score >= 650 ? 'bg-green-50 border-green-200 text-green-800' : creditScore && creditScore.current_score >= 550 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-red-50 border-red-200 text-red-800'} border backdrop-blur-sm text-sm p-4 rounded-2xl shadow-sm`}>
                <p className="font-semibold mb-2">
                  {creditScore ? getCreditScoreLabel(creditScore.current_score) : "Good"} credit score
                </p>
                <p className="text-xs leading-relaxed">
                  {creditScore && creditScore.current_score >= 650 
                    ? "You qualify for loans with competitive interest rates."
                    : creditScore && creditScore.current_score >= 550
                    ? "You may qualify for loans with moderate interest rates."
                    : "Work on improving your credit score for better loan terms."
                  }
                </p>
                {creditScore && (
                  <div className="mt-3 text-xs bg-white/50 rounded-lg p-2">
                    <p>Total: {creditScore.total_loans} | Early: {creditScore.early_payments} | On-time: {creditScore.on_time_payments} | Late: {creditScore.late_payments}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Button */}
            <button className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-semibold">
              Verify Your Account
            </button>
          </div>
        </div>
        
        <Outlet />
      </div>
    </div> 
  );
};

export default DefaultDashboardContent;