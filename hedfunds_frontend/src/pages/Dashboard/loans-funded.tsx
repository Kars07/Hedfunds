import React, { useState, useEffect } from "react";
import { Address, LucidEvolution, validatorToAddress, SpendingValidator, UTxO, Data } from "@lucid-evolution/lucid";
import { useWallet } from "./Dashboard"; 

const loanRequestValidatorScript: SpendingValidator = {
    type: "PlutusV2",
    script: "59030501010029800aba2aba1aba0aab9faab9eaab9dab9a488888896600264653001300800198041804800cc0200092225980099b8748008c01cdd500144ca60026018003300c300d0019b87480012223322598009801800c566002601c6ea802600516403d15980099b874800800626464653001375a6028003375a6028007375a60280049112cc004c06001201116405430140013013001300e37540131640308060566002600260166ea800a33001300f300c37540052301030113011301130113011301130113011001911919800800801912cc00400629422b30013371e6eb8c04c00400e2946266004004602800280710112444b30013004300e375401513300137586004601e6ea8020dd7180918079baa0038999119912cc004c020c048dd5000c4cc88cc88c966002601a602e6ea8006264b30013370e9002180c1baa0018992cc004c03cc064dd5000c4c8c8c8ca60026eb4c0840066eb8c0840126eb4c08400e6eb4c0840092222598009813002c56600266e3cdd7181298111baa009375c604a60446ea805a2b30013370e6eb4c038c088dd50049bad30250138acc004cdc39bad300c302237540126eb4c0940462b30013370e6eb4c094c098c098c098c088dd50049bad3025302601189980a1bac3015302237540366eb8c094c088dd500b452820408a50408114a0810229410204590230c084004c080004c07c004c068dd5000c59018180e180c9baa0018b202e300230183754603660306ea80062c80b0cc01cdd61800980b9baa01025980099baf301b30183754603660306ea800400e266ebcc010c060dd50009802180c1baa30043018375400b14a080b0c060c054dd5180c180a9baa3001301537540044603260346034002602c60266ea80048c05cc0600062c8088c054008cc004dd6180a18089baa00a23375e602a60246ea8004024c03cdd5005111919800800801912cc0040062980103d87a80008992cc004c010006266e952000330160014bd7044cc00c00cc060009012180b000a02840348b2014300b375400e30083754005164018300800130033754011149a26cac80081"
};

const FundRequestValidatorScript: SpendingValidator = {
    type: "PlutusV2",
    script: "59028801010029800aba2aba1aba0aab9faab9eaab9dab9a488888896600264653001300800198041804800cdc3a400530080024888966002600460106ea800e2653001300d00198069807000cdc3a40009112cc004c004c030dd500444c8c8cc8966002602a00713259800980318089baa0018acc004c018c044dd5003c4ca60026eb8c0580064602e60300033016301337540109112cc006600266e3c00cdd7180c980b1baa001a50a51405115980099b87375a603260340086eb4c008c058dd5000c5660026644b30013232598009807000c528c566002602600313259800980a180d1baa3007301b3754603c60366ea8016266e24004012266e200040110191bad301d301a375400514a080c1018180c1baa001301b30183754603660306ea800a26464b3001300e0018a508acc004c04c006264b30013014301a3754600e60366ea8c01cc06cdd5002c4cdc4802000c4cdc4002000a032375a603a60346ea800a2945018203030183754002603660306ea8c010c060dd50014528202c3019301a301a301a301a301a301a301a3016375401c6eb4c064c068c068c068c058dd5000c56600264660020026eb0c068c06cc06cc06cc06cc06cc06cc06cc06cc05cdd5007912cc00400629422b30013371e6eb8c06c0040162946266004004603800280b101944cdd7980c980b1baa30193016375400a01914a080a22941014452820288a5040503012375401b16404116404064660020026eb0c054c048dd5005112cc004006298103d87a80008992cc004cdd7980b980a1baa00100a899ba548000cc0580052f5c113300300330180024048602c00280a22c8090dd698090009bae30120023012001300d375401116402c3009375400716401c300800130033754011149a26cac80081"
};

const RepayRequestValidatorScript: SpendingValidator = {
    type: "PlutusV2",
    script: "59027201010029800aba2aba1aba0aab9faab9eaab9dab9a488888896600264653001300800198041804800cdc3a400530080024888966002600460106ea800e2653001300d00198069807000cdc3a40009112cc004c004c030dd500444c8c966002602600513259800980218079baa0018acc004c010c03cdd5002c4cc89660026466446600400400244b30010018a508acc004cdc79bae30180010038a51899801001180c800a02640586eb0c058c05cc05cc05cc05cc05cc05cc05cc05cc04cdd50059bae30153012375400515980099b87375a602a60246ea8034cdc01bad3001301237540046eb4c054c058c058c048dd500145660026644b30013232598009805000c528c566002601e003132598009808180b1baa3006301737546034602e6ea8016266e24004012266e200040110151bad30193016375400514a080a1014180a1baa001301730143754602e60286ea800a26464b3001300a0018a508acc004c03c006264b3001301030163754600c602e6ea8c018c05cdd5002c4cdc4802000c4cdc4002000a02a375a6032602c6ea800a2945014202830143754002602e60286ea8c00cc050dd50014528202430153016301630163016301630163016301237540146eb4c054c058c058c058c048dd500144cdd7980a98091baa30153012375400601114a0808229410104528202030133010375400a46028602a00316403916403864660020026eb0c04cc040dd5004112cc004006298103d87a80008992cc004cdd7980a98091baa001008899ba548000cc0500052f5c113300300330160024040602800280922c8080dd6980880098069baa0088b201618049baa0038b200e180400098019baa0088a4d1365640041"
};


// Define addresses based on validators
const LoanRequestAddress: Address = validatorToAddress("Preprod", loanRequestValidatorScript);
const FundLoanAddress: Address = validatorToAddress("Preprod", FundRequestValidatorScript);
const RepayLoanAddress: Address = validatorToAddress("Preprod", RepayRequestValidatorScript);

// Define data schemas
const fundloanredeemerschema = Data.Object({
    lenderPKH: Data.Bytes(),
    loanAmount: Data.Integer(),
});
type redeemerType = Data.Static<typeof fundloanredeemerschema>;
const redeemerType = fundloanredeemerschema as unknown as redeemerType;

// Types for funded loan details
type FundedLoanDetails = {
    loanId: string;                // Original loan request UTXO ID
    fundedLoanId: string;          // Funded loan UTXO ID
    fundedAt: number;              // Timestamp when loan was funded
    lenderPKH: string;             // Payment key hash of the lender (should match current user)
    borrowerPKH: string;           // Payment key hash of the borrower
    loanAmount: string;            // Loan amount in lovelace (as string)
    interest: string;              // Interest amount in lovelace (as string)
    deadline: string;              // Deadline timestamp (as string)
    txHash: string;                // Transaction hash of the funding transaction
    fundedWith: Array<{            // UTxO details used for funding
        txHash: string;
        outputIndex: number;
    }>;
    isActive: boolean;             // Whether the loan is still active (not repaid)
    repaymentInfo?: {              // Repayment details if loan has been repaid
        repaidAt: number;
        repaymentTxHash: string;
    };
};
type CivilServantData = {
    full_name: string;
    company_name: string;
    verification_status: string;
};
const API_BASE_URL = "https://swiftfund-6b61.onrender.com/api/loans";
const LoansFunded: React.FC = () => {
    const { connection, isConnecting } = useWallet();
    const [fundedLoans, setFundedLoans] = useState<FundedLoanDetails[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const [initialized, setInitialized] = useState<boolean>(false);
    const [debugInfo, setDebugInfo] = useState<string>("No errors");
    const [civilServants, setCivilServants] = useState<Map<string, CivilServantData>>(new Map());

    useEffect(() => {
        setInitialized(true);
    }, []);

    // Effect to refresh data periodically (every 60 seconds)
    useEffect(() => {
        if (connection) {
            const intervalId = setInterval(() => {
                setRefreshTrigger(prev => prev + 1);
            }, 60000);
            
            return () => clearInterval(intervalId);
        }
    }, [connection]);

    // Load data when connection changes or refresh is triggered
    useEffect(() => {
        if (connection && initialized) {
            loadFundedLoansData(connection.pkh, connection.lucid);
        }
    }, [connection, initialized]);

    // Effect to reload data when refresh is triggered
    useEffect(() => {
        if (connection && refreshTrigger > 0) {
            loadFundedLoansData(connection.pkh, connection.lucid);
        }
    }, [refreshTrigger, connection]);

    // Function to create unique identifier for UTxO
    function createUtxoId(txHash: string, outputIndex: number): string {
        return `${txHash}-${outputIndex}`;
    }

    //Function to load funded loans data from API 
    async function loadFundedLoansData(userPkh: string, lucidInstance: LucidEvolution): Promise<void> {
        try {
            setIsLoading(true);
            setError(null);

            // Get funded loans from API endpoint 
            const response = await fetch(`${API_BASE_URL}/lender/${userPkh}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'error') {
                throw new Error(data.message || 'Failed to load funded loans');
            }
            
            // Store the data from API
            setFundedLoans(data.loans || []);
            
            // Then verify against on-chain data to update status
            try {
                await verifyOnChainState(lucidInstance, data.loans || []);
            } catch (error) {
                console.error("Error in verifyOnChainState:", error);
                setDebugInfo(`Error in verifyOnChainState: ${error instanceof Error ? error.message : String(error)}`);
            }
            
        } catch (error) {
            console.error("Error loading funded loans data:", error);
            setError("Failed to load funded loans data. Please try again.");
            setDebugInfo(`Error loading funded loans data: ${error instanceof Error ? error.message : String(error)}`);
          
        } finally {
            setIsLoading(false);
        }
    }

    //Function to verify on-chain state and update loan statuses via API
    async function verifyOnChainState(lucidInstance: LucidEvolution, loans: FundedLoanDetails[]): Promise<void> {
        try {
            // Get all UTXOs at fund loan address and repay address
            let fundedUtxos: UTxO[] = [];
            
            try {
                fundedUtxos = await lucidInstance.utxosAt(FundLoanAddress);
            } catch (error) {
                console.error("Error fetching funded UTXOs:", error);
                setDebugInfo(`Error fetching funded UTXOs: ${error instanceof Error ? error.message : String(error)}`);
                return; // Exit early if we can't get UTXOs
            }
            
            // Create a list of active funded loan UTXOs for verification
            const activeFundedUTXOs = fundedUtxos.map(utxo => {
                try {
                    return {
                        id: createUtxoId(utxo.txHash, utxo.outputIndex),
                        txHash: utxo.txHash,
                        outputIndex: utxo.outputIndex
                    };
                } catch (error) {
                    console.error("Error processing funded UTXO:", error);
                    return null;
                }
            }).filter(x => x !== null);
            
            // Calling the API to verify and update any loans that are no longer on-chain
            if (activeFundedUTXOs.length > 0) {
                try {
                    const response = await fetch(`${API_BASE_URL}/verify`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ activeFundedUTXOs }),
                    });
                    
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    
                    if (result.status === 'error') {
                        throw new Error(result.message || 'Failed to verify loans');
                    }
                    
                    // After verification, refresh the loans list to get updated statuses
                    if (connection) {
                        loadFundedLoansData(connection.pkh, connection.lucid);
                    }
                    
                } catch (error) {
                    console.error("Error verifying loans with API:", error);
                    // setDebugInfo(`Error verifying loans with API: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        } catch (error) {
            console.error("Error verifying on-chain state:", error);
            setDebugInfo(`Error verifying on-chain state: ${error instanceof Error ? error.message : String(error)}`);
            throw error; 
        }
    }
    
    // Function to record a new funded loan via API
    async function recordFundedLoan(loanData: {
        loanId: string;
        fundedLoanId: string;
        lenderPKH: string;
        borrowerPKH: string;
        loanAmount: string;
        interest: string;
        deadline: string;
        txHash: string;
        fundedWith: Array<{txHash: string, outputIndex: number}>;
        fundedAt: number;
    }): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/funded`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loanData),
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status === 'error') {
                throw new Error(result.message || 'Failed to record funded loan');
            }
            
            // Refresh the loans list after recording a new loan
            if (connection) {
                loadFundedLoansData(connection.pkh, connection.lucid);
            }
            
            return true;
        } catch (error) {
            console.error("Error recording funded loan:", error);
            setDebugInfo(`Error recording funded loan: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    
    //Function to record a loan repayment via API
    async function recordLoanRepayment(repaymentData: {
        fundedLoanId: string;
        repaidAt: number;
        repaymentTxHash: string;
    }): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/repay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(repaymentData),
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status === 'error') {
                throw new Error(result.message || 'Failed to record loan repayment');
            }
            
            // Refresh the loans list after recording a repayment
            if (connection) {
                loadFundedLoansData(connection.pkh, connection.lucid);
            }
            
            return true;
        } catch (error) {
            console.error("Error recording loan repayment:", error);
            setDebugInfo(`Error recording loan repayment: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    
    // Format lovelace to ADA
    function lovelaceToAda(lovelace: string): string {
        try {
            return (Number(lovelace) / 1_000_000).toFixed(6);
        } catch (error) {
            console.error("Error converting lovelace to ADA:", error);
            return "0.000000";
        }
    }
    
    // Format date
    function formatDate(timestamp: number): string {
        try {
            return new Date(timestamp).toLocaleString();
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid date";
        }
    }
    
    // Calculate total amount (loan + interest)
    function calculateTotal(loanAmount: string, interest: string): string {
        try {
            return (Number(loanAmount) + Number(interest)).toString();
        } catch (error) {
            console.error("Error calculating total:", error);
            return "0";
        }
    }
    
    // Check if loan is overdue (past deadline)
    function isOverdue(deadline: string): boolean {
        try {
            return Number(deadline) < Date.now();
        } catch (error) {
            console.error("Error checking if loan is overdue:", error);
            return false;
        }
    }
    
    // Calculate days until/past deadline
    function daysFromDeadline(deadline: string): { days: number; isPast: boolean } {
        try {
            const now = Date.now();
            const deadlineTime = Number(deadline);
            const diffMs = Math.abs(deadlineTime - now);
            const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            return { days, isPast: deadlineTime < now };
        } catch (error) {
            console.error("Error calculating days from deadline:", error);
            return { days: 0, isPast: false };
        }
    }

    // Function to manually trigger a refresh
    const handleManualRefresh = () => {
        if (connection) {
            setIsLoading(true);
            loadFundedLoansData(connection.pkh, connection.lucid);
        }
    };

    // Filter active and repaid loans
    const activeLoans = fundedLoans.filter(loan => loan.isActive);
    const repaidLoans = fundedLoans.filter(loan => !loan.isActive);
    
    // If we're still initializing, show a loading indicator
    if (!initialized) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-3"></div>
                <p>Initializing application...</p>
            </div>
        );
    }
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
                    <p className="text-gray-600 text-lg">Track and manage your funded loan portfolio in the decentralized ecosystem</p>
                </div>

                {/* Debug Info - Can be removed in production */}
                {debugInfo !== "No errors" && (
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 backdrop-blur-xl border border-yellow-200 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                            <div>
                                <p className="text-yellow-700 font-semibold">Debug Info</p>
                                <p className="text-yellow-600 text-sm">{debugInfo}</p>
                            </div>
                        </div>
                    </div>
                )}
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
                <div className="mb-8 bg-gradient-to-r from-white-100 to-orange-100 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
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
                        <p className="text-3xl font-bold text-purple-900">
                            {connection ? activeLoans.filter(l => isOverdue(l.deadline)).length : 0}
                        </p>
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
                            try {
                                const totalExpected = calculateTotal(loan.loanAmount, loan.interest);
                                const deadline = daysFromDeadline(loan.deadline);
                                const isLoanOverdue = isOverdue(loan.deadline);
                                
                                return (
                                    <div 
                                        key={loan.fundedLoanId}
                                        className={`group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] ${
                                            isLoanOverdue ? 'border-red-300 bg-gradient-to-r from-red-50/80 to-red-100/80' : 'border-gray-200'
                                        }`}
                                        style={{animationDelay: `${index * 100}ms`}}
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                            {/* Borrower Info */}
                                            <div className="lg:col-span-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {loan.borrowerPKH.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600 text-sm">Borrower</p>
                                                        <p className="text-gray-800 font-mono text-sm">
                                                            {loan.borrowerPKH.substring(0, 8)}...{loan.borrowerPKH.substring(loan.borrowerPKH.length - 8)}
                                                        </p>
                                                        <p className="text-gray-500 text-xs mt-1">
                                                            Funded: {formatDate(loan.fundedAt)}
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
                                                            {lovelaceToAda(loan.loanAmount)} <span className="text-sm text-gray-500">ADA</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Interest</p>
                                                        <p className="text-lg font-semibold text-yellow-600">
                                                            {lovelaceToAda(loan.interest)} <span className="text-sm text-gray-500">ADA</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Expected Total</p>
                                                        <p className="text-lg font-bold text-green-600">
                                                            {lovelaceToAda(totalExpected)} <span className="text-sm text-gray-500">ADA</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Deadline & Status */}
                                            <div className="lg:col-span-3">
                                                <div className="text-center">
                                                    <p className="text-gray-500 text-sm mb-1">Deadline</p>
                                                    <p className="text-gray-800 text-sm mb-2">{formatDate(Number(loan.deadline))}</p>
                                                    <div className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium ${
                                                        isLoanOverdue 
                                                            ? 'bg-red-100 text-red-700 border border-red-200' 
                                                            : 'bg-green-100 text-green-700 border border-green-200'
                                                    }`}>
                                                        <div className={`w-2 h-2 rounded-full mr-2 ${
                                                            isLoanOverdue ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                                                        }`}></div>
                                                        {isLoanOverdue 
                                                            ? `${deadline.days} days overdue`
                                                            : `${deadline.days} days remaining`
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Transaction Link */}
                                            <div className="lg:col-span-2">
                                                <div className="text-right">
                                                    <a 
                                                        href={`https://preprod.cardanoscan.io/transaction/${loan.txHash}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm"
                                                    >
                                                        <span>View Transaction</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                                        </svg>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Loan ID */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-xs text-gray-400 font-mono">
                                                Loan ID: {loan.fundedLoanId}
                                            </p>
                                        </div>
                                    </div>
                                );
                            } catch (error) {
                                return null;
                            }
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
                            try {
                                const totalExpected = calculateTotal(loan.loanAmount, loan.interest);
                                
                                return (
                                    <div 
                                        key={loan.fundedLoanId}
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
                                                            {loan.borrowerPKH.substring(0, 8)}...{loan.borrowerPKH.substring(loan.borrowerPKH.length - 8)}
                                                        </p>
                                                        <p className="text-gray-500 text-xs mt-1">
                                                            Funded: {formatDate(loan.fundedAt)}
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
                                                            {lovelaceToAda(loan.loanAmount)} <span className="text-sm text-gray-500">ADA</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Interest</p>
                                                        <p className="text-lg font-semibold text-yellow-600">
                                                            {lovelaceToAda(loan.interest)} <span className="text-sm text-gray-500">ADA</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm mb-1">Total Received</p>
                                                        <p className="text-lg font-bold text-green-600">
                                                            {lovelaceToAda(totalExpected)} <span className="text-sm text-gray-500">ADA</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Repayment Info */}
                                            <div className="lg:col-span-3">
                                                <div className="text-center">
                                                    <p className="text-gray-500 text-sm mb-1">Repaid On</p>
                                                    <p className="text-gray-800 text-sm mb-2">
                                                        {loan.repaymentInfo ? formatDate(loan.repaymentInfo.repaidAt) : '-'}
                                                    </p>
                                                    <div className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-green-100 text-green-700 border border-green-200">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                                        Completed
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Transaction Links */}
                                            <div className="lg:col-span-2">
                                                <div className="text-right space-y-2">
                                                    <a 
                                                        href={`https://preprod.cardanoscan.io/transaction/${loan.txHash}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="block bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-3 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-xs"
                                                    >
                                                        <div className="flex items-center justify-center">
                                                            <span>Funding Tx</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                                            </svg>
                                                        </div>
                                                    </a>
                                                    {loan.repaymentInfo ? (
                                                        <a 
                                                            href={`https://preprod.cardanoscan.io/transaction/${loan.repaymentInfo.repaymentTxHash}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="block bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-3 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-xs"
                                                        >
                                                            <div className="flex items-center justify-center">
                                                                <span>Repayment Tx</span>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                                                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                                                </svg>
                                                            </div>
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Loan ID */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-xs text-gray-400 font-mono">
                                                Loan ID: {loan.fundedLoanId}
                                            </p>
                                        </div>
                                    </div>
                                );
                            } catch (error) {
                                return null;
                            }
                        })}
                    </div>
                )}
            </div>
        </div>
    </div>
);
};

export default LoansFunded;