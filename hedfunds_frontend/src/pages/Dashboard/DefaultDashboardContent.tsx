import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Address, LucidEvolution, SpendingValidator, validatorToAddress, WalletApi, UTxO, Data } from "@lucid-evolution/lucid";
import RepaymentTimelineChart from './RepaymentTimelineChart';
import default_profile from "../../assets/avatar-default.png";
import { useWallet } from "./Dashboard"; 

type Connection = {
  api: WalletApi;
  lucid: LucidEvolution;
  address: Address;
  pkh: string;
};

// API Types - Matching the PHP API responses
type Loan = {
  loanId: string;
  fundedLoanId: string;
  fundedAt: number;
  lenderPKH: string;
  borrowerPKH: string;
  loanAmount: number;
  interest: number;
  deadline: string;
  txHash: string;
  isActive: boolean;
  fundedWith?: Array<{
    txHash: string;
    outputIndex: number;
  }>;
  repaymentInfo?: {
    repaidAt: number;
    repaymentTxHash: string;
  };
};

type RepaidLoan = {
  id: string;
  data: {
    repaidAt: number;
    repaymentTxHash: string;
    loanAmount: number;
    interest: number;
    originalLoanId: string;
    lenderPKH: string;
    borrowerPKH: string;
  };
};

type CreditScoreData = {
  current_score: number;
  total_loans: number;
  on_time_payments: number;
  early_payments: number;
  late_payments: number;
};

const API_BASE_URL = "https://swiftfund-6b61.onrender.com";
function shortenAddress(address: string, start = 6, end = 4) {
  if (!address) return "";
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

const loanRequestValidatorScript: SpendingValidator = {
    type: "PlutusV2",
    script: "59030501010029800aba2aba1aba0aab9faab9eaab9dab9a488888896600264653001300800198041804800cc0200092225980099b8748008c01cdd500144ca60026018003300c300d0019b87480012223322598009801800c566002601c6ea802600516403d15980099b874800800626464653001375a6028003375a6028007375a60280049112cc004c06001201116405430140013013001300e37540131640308060566002600260166ea800a33001300f300c37540052301030113011301130113011301130113011001911919800800801912cc00400629422b30013371e6eb8c04c00400e2946266004004602800280710112444b30013004300e375401513300137586004601e6ea8020dd7180918079baa0038999119912cc004c020c048dd5000c4cc88cc88c966002601a602e6ea8006264b30013370e9002180c1baa0018992cc004c03cc064dd5000c4c8c8c8ca60026eb4c0840066eb8c0840126eb4c08400e6eb4c0840092222598009813002c56600266e3cdd7181298111baa009375c604a60446ea805a2b30013370e6eb4c038c088dd50049bad30250138acc004cdc39bad300c302237540126eb4c0940462b30013370e6eb4c094c098c098c098c088dd50049bad3025302601189980a1bac3015302237540366eb8c094c088dd500b452820408a50408114a0810229410204590230c084004c080004c07c004c068dd5000c59018180e180c9baa0018b202e300230183754603660306ea80062c80b0cc01cdd61800980b9baa01025980099baf301b30183754603660306ea800400e266ebcc010c060dd50009802180c1baa30043018375400b14a080b0c060c054dd5180c180a9baa3001301537540044603260346034002602c60266ea80048c05cc0600062c8088c054008cc004dd6180a18089baa00a23375e602a60246ea8004024c03cdd5005111919800800801912cc0040062980103d87a80008992cc004c010006266e952000330160014bd7044cc00c00cc060009012180b000a02840348b2014300b375400e30083754005164018300800130033754011149a26cac80081"
};

const FundRequestValidatorScript: SpendingValidator = {
    type: "PlutusV2",
    script: "59028801010029800aba2aba1aba0aab9faab9eaab9dab9a488888896600264653001300800198041804800cdc3a400530080024888966002600460106ea800e2653001300d00198069807000cdc3a40009112cc004c004c030dd500444c8c8cc8966002602a00713259800980318089baa0018acc004c018c044dd5003c4ca60026eb8c0580064602e60300033016301337540109112cc006600266e3c00cdd7180c980b1baa001a50a51405115980099b87375a603260340086eb4c008c058dd5000c5660026644b30013232598009807000c528c566002602600313259800980a180d1baa3007301b3754603c60366ea8016266e24004012266e200040110191bad301d301a375400514a080c1018180c1baa001301b30183754603660306ea800a26464b3001300e0018a508acc004c04c006264b30013014301a3754600e60366ea8c01cc06cdd5002c4cdc4802000c4cdc4002000a032375a603a60346ea800a2945018203030183754002603660306ea8c010c060dd50014528202c3019301a301a301a301a301a301a301a3016375401c6eb4c064c068c068c068c058dd5000c56600264660020026eb0c068c06cc06cc06cc06cc06cc06cc06cc06cc05cdd5007912cc00400629422b30013371e6eb8c06c0040162946266004004603800280b101944cdd7980c980b1baa30193016375400a01914a080a22941014452820288a5040503012375401b16404116404064660020026eb0c054c048dd5005112cc004006298103d87a80008992cc004cdd7980b980a1baa00100a899ba548000cc0580052f5c113300300330180024048602c00280a22c8090dd698090009bae30120023012001300d375401116402c3009375400716401c300800130033754011149a26cac80081"
};

const LoanRequestAddress: Address = validatorToAddress("Preprod", loanRequestValidatorScript);
const FundLoanAddress: Address = validatorToAddress("Preprod", FundRequestValidatorScript);

// Define data schemas
const loanRequestSchema = Data.Object({
  borrowerPKH: Data.Bytes(),
  loanAmount: Data.Integer(),
  interest: Data.Integer(),
  deadline: Data.Integer(),
});
type BorrowerDatum = Data.Static<typeof loanRequestSchema>;
const BorrowerDatum = loanRequestSchema as unknown as BorrowerDatum;

const fundloanredeemerschema = Data.Object({
  lenderPKH: Data.Bytes(),
  loanAmount: Data.Integer(),
});
type redeemerType = Data.Static<typeof fundloanredeemerschema>;
const redeemerType = fundloanredeemerschema as unknown as redeemerType;

const DefaultDashboardContent: React.FC = () => {
  // Use wallet context from Dashboard
  const { connection, wallets, isConnecting, connectWallet } = useWallet();
  
  const [adaToNgnRate, setAdaToNgnRate] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<bigint | null>(null);

  // Dashboard statistics
  const [activeLoans, setActiveLoans] = useState<number>(0);
  const [totalApplications, setTotalApplications] = useState<number>(0);
  const [pendingApproval, setPendingApproval] = useState<number>(0);
  const [totalRepaid, setTotalRepaid] = useState<number>(0);
  
  // Credit Score State
  const [creditScore, setCreditScore] = useState<CreditScoreData | null>(null);
  const [isCreditScoreLoading, setIsCreditScoreLoading] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
 
  const navigate = useNavigate();

  // Fetch exchange rates
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=ngn"
        );
        const data = await response.json();
        const rate = data.cardano.ngn;
        setAdaToNgnRate(rate);
      } catch (error) {
        console.error("Error fetching exchange rate", error);
      }
    };

    fetchExchangeRate();
  }, []);

  // Load user data
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

  // Fetch credit score function
  const fetchCreditScore = async (userPKH: string): Promise<void> => {
    try {
      setIsCreditScoreLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/loans/credit-score/${userPKH}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setCreditScore(data.creditScore);
      } else {
        console.error("Error fetching credit score:", data.message);
        // Set default credit score if none exists
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
      // Set default credit score on error
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

  // Credit score utility functions
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
    return Math.min((score / 850) * 100, 100); // Assuming max score is 850
  };

  // Fetch wallet balance and loan statistics when connection changes
  useEffect(() => {
    if (connection) {
      fetchWalletBalance();
      fetchLoanStatistics();
      fetchCreditScore(connection.pkh);
    }
  }, [connection]);

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    if (!connection) return;
    
    try {
      const utxos = await connection.lucid.wallet().getUtxos();
      const balance = utxos.reduce((acc, utxo) => {
        return acc + utxo.assets.lovelace;
      }, BigInt(0));
      setWalletBalance(balance);
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  };

  // Fetch loan statistics from API
  const fetchLoanStatistics = async () => {
    if (!connection) return;
    setIsLoading(true);
    
    try {
      // Fetch borrower loans (active loans)
      const activeLoansResponse = await fetch(`${API_BASE_URL}/api/loans/borrower/${connection.pkh}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const activeLoansData = await activeLoansResponse.json();
      
      if (activeLoansData.status === 'success') {
        // Active loans are those that are funded and not repaid yet
        setActiveLoans(activeLoansData.loans.length);
      }
      
      // Fetch repaid loans
      const repaidLoansResponse = await fetch(`${API_BASE_URL}/api/loans/borrower/${connection.pkh}/repaid`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const repaidLoansData = await repaidLoansResponse.json();
      
      if (repaidLoansData.status === 'success') {
        setTotalRepaid(repaidLoansData.repaidLoans.length);
      }
      
      // For total applications and pending approvals, we still need to check on-chain data
      await fetchChainLoanStatistics(connection);
      
    } catch (error) {
      console.error("Error fetching loan statistics from API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on-chain loan statistics for total applications and pending approvals
  async function fetchChainLoanStatistics(conn: Connection): Promise<void> {
    try {
      const { lucid, pkh } = conn;
      
      // Get all loan requests from the script address
      const utxosAtScript: UTxO[] = await lucid.utxosAt(LoanRequestAddress);
      console.log("UTXOs at loan request address:", utxosAtScript);
      
      // Also get funded loans to check status
      const fundedUtxos: UTxO[] = await lucid.utxosAt(FundLoanAddress);
      console.log("UTXOs at fund loan address:", fundedUtxos);
      
      // Extract loanAmount from funded loans to check if a loan is funded
      const fundedLoanAmounts = new Set<string>();
      
      for (const utxo of fundedUtxos) {
        if (!utxo.datum) continue;
        
        try {
          const datumObject = Data.from(utxo.datum, redeemerType);
          fundedLoanAmounts.add(datumObject.loanAmount.toString());
        } catch (error) {
          console.error("Error parsing funded loan datum:", error);
        }
      }

      let userTotalApplications = 0;
      let userPendingApprovals = 0;
      
      for (const utxo of utxosAtScript) {
        if (!utxo.datum) continue;
        
        try {
          const datumObject = Data.from(utxo.datum, BorrowerDatum);
          
          // Check if this loan request belongs to the connected user
          if (datumObject.borrowerPKH === pkh) {
            // Count total applications by this user
            userTotalApplications++;
            
            // Check if loan is not expired (pending approval)
            const now = BigInt(Date.now());
            if (datumObject.deadline > now) {
              userPendingApprovals++;
            }
          }
        } catch (error) {
          console.error("Error parsing datum:", error, "UTxO:", utxo);
        }
      }

      setTotalApplications(userTotalApplications);
      setPendingApproval(userPendingApprovals);
    } catch (error) {
      console.error("Error fetching on-chain loan statistics:", error);
    }
  }

  // Format lovelace to ADA
  function lovelaceToAda(lovelace: bigint | null): string {
    if (!lovelace) return "0";
    return (Number(lovelace) / 1_000_000).toFixed(2);
  }
  
  // Format ADA to NGN
  function adaToNgn(ada: string): string {
    if (!adaToNgnRate) return "0";
    return (parseFloat(ada) * adaToNgnRate).toFixed(2);
  }

  // Format wallet address for display
  function formatAddress(address: string | undefined): string {
    if (!address) return "";
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  }
  
  // Close dropdown if clicked outside
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
              
                {connection?.address && (
                  <>
                    <div className="h-px bg-gradient-to-r from-gray-300 to-transparent mb-4"></div>
                    <p className="text-sm text-gray-600 mb-2">Wallet Address:</p>
                    <div className="bg-gray-100/60 rounded-xl p-3">
                      <p className="text-xs font-mono text-orange-600 break-all">
                        {shortenAddress(connection.address)}
                      </p>
                    </div>
                  </>
                )}
              </div>  
            )}
          </div>
        </div>

        {/* Welcome Section - Full width on mobile */}
        <div className="md:flex pt-10 md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              Welcome, {userName} 
            </h1>
            <p className="text-gray-600 text-sm md:text-base">Your personal loan management dashboard in the decentralized ecosystem</p>
          </div>

          {/* Desktop Layout - Icons on the right (hidden on mobile) */}
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
                <div className="absolute  right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl z-50 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-gray-600">Signed in as</p>
                  </div>
                  <p className="font-semibold text-gray-800 mb-4">{userName || "User"}</p>
                
                  {connection?.address && (
                    <>
                      <div className="h-px bg-gradient-to-r from-gray-300 to-transparent mb-4"></div>
                      <p className="text-sm text-gray-600 mb-2">Wallet Address:</p>
                      <div className="bg-gray-100/60 rounded-xl p-3">
                        <p className="text-xs font-mono text-orange-600 break-all">
                          {shortenAddress(connection.address)}
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
      
      {/* Stats Cards - Improved layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl  mx-auto">
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

      {/* Wallet Balance Section - Improved design */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-3xl shadow-xl p-8 mb-8 max-w-5xl mx-auto"> 
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-1 h-12 bg-white/50 rounded-full"></div>
            <div>
              <h2 className="text-2xl font-bold text-white">Wallet Balance</h2>
              <div className="h-px w-24 bg-white/30 mt-2"></div>
            </div>
          </div>
          
          {!connection ? (
            <div className="flex flex-wrap gap-3">
              {wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => connectWallet(wallet)}
                  disabled={isConnecting}
                  className="group flex items-center bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  {wallet.icon && (
                    <img src={wallet.icon} alt={wallet.name} className="w-5 h-5 mr-3 group-hover:animate-spin" />
                  )}
                  {isConnecting ? "Connecting..." : `Connect ${wallet.name}`}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white/20 backdrop-blur-sm border border-white/30 hidden md:block rounded-2xl p-4">
              <div className="flex items-center space-x-2`">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-white font-semibold">Wallet Connected</p>
                  <p className="text-orange-100 text-sm font-mono">
                    {formatAddress(connection.address)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <p className="text-orange-100 text-sm mb-2">Total Balance (₦)</p> 
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              ₦ {connection ? adaToNgn(lovelaceToAda(walletBalance)) : "0"}
            </h3>
          </div>

          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <p className="text-orange-100 text-sm mb-2">Total Balance (ADA)</p>
            <h3 className="text-2xl md:text-3xl font-bold text-white"> 
              {connection ? lovelaceToAda(walletBalance) : "0"} ADA
            </h3>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Improved spacing */}
      <div className="flex  flex-col md:flex-row gap-6  mx-auto">
        {/* Chart Section */}
        <div className=" md:w-[60%] p-7 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-lg">
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