import React, { useState, useEffect } from "react";
import { Address, validatorToAddress, UTxO, Data, SpendingValidator } from "@lucid-evolution/lucid";
import { useWallet } from "./Dashboard";
import axios from "axios"; 

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


const API_BASE_URL = "https://swiftfund-6b61.onrender.com/api/loans";

type LoanRequest = {
    txId: string;
    outputIndex: number;
    borrowerPKH: string;
    loanAmount: bigint;
    interest: bigint;
    deadline: bigint;
    datumObject: any;
    utxo: UTxO;
    uniqueId: string; // Unique identifier for this specific loan request UTXO
    status: "active" | "funded" | "expired"; // Status of the loan request
};

// Define data schemas
const loanRequestSchema = Data.Object({
    borrowerPKH: Data.Bytes(),
    loanAmount: Data.Integer(),
    interest: Data.Integer(),
    deadline: Data.Integer(),
});
type BorrowerDatum = Data.Static<typeof loanRequestSchema>;
const BorrowerDatum = loanRequestSchema as unknown as BorrowerDatum;

const MyLoanApplications: React.FC = () => {
    const { connection } = useWallet(); // Use the wallet connection from context
    const [myLoanRequests, setMyLoanRequests] = useState<LoanRequest[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Create a unique identifier for a specific UTxO
    function createUtxoId(txId: string, outputIndex: number): string {
        return `${txId}-${outputIndex}`;
    }

    // Effect to fetch loan requests when connection changes
    useEffect(() => {
        if (connection) {
            fetchMyLoanRequests(connection);
        }
    }, [connection]);

    // Helper function to get funded loan IDs from the API
    async function getFundedLoanIds(): Promise<string[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/funded/ids`);
            if (response.data.status === 'success') {
                return response.data.loanIds || [];
            }
            return [];
        } catch (error) {
            console.error("Error fetching funded loan IDs:", error);
            return [];
        }
    }

    // Fetch user's loan requests
    async function fetchMyLoanRequests(conn: any): Promise<void> {
        try {
            setIsLoading(true);
            setError(null);
            
            const { lucid, pkh } = conn;
            
            // Get all loan requests from script address
            const utxosAtScript: UTxO[] = await lucid.utxosAt(LoanRequestAddress);
            console.log("UTxOs at loan request address:", utxosAtScript);

            const requests: LoanRequest[] = [];
            const currentTime = Date.now();
            
            // Get funded loans from the API instead of localStorage
            const fundedLoanIds = await getFundedLoanIds();
            console.log("Funded loan IDs from API:", fundedLoanIds);
            
            // Create a map for quick lookups
            const fundedLoansMap: Record<string, boolean> = {};
            fundedLoanIds.forEach(id => {
                fundedLoansMap[id] = true;
            });
            
            for (const utxo of utxosAtScript) {
                if (!utxo.datum) continue;
                
                try {
                    const datumObject = Data.from(utxo.datum, BorrowerDatum);
                    
                    // Create a unique identifier for this loan request UTXO
                    const loanId = createUtxoId(utxo.txHash, utxo.outputIndex);
                    
                    // Only process if the borrower PKH matches the current user's PKH
                    if (datumObject.borrowerPKH === pkh) {
                        // Determine loan status
                        let status: "active" | "funded" | "expired" = "active";
                        
                        // Check if loan is expired
                        if (Number(datumObject.deadline) < currentTime) {
                            status = "expired";
                        }
                        
                        // Check if loan is funded using API data
                        if (fundedLoansMap[loanId]) {
                            status = "funded";
                        }
                        
                        requests.push({
                            txId: utxo.txHash,
                            outputIndex: utxo.outputIndex,
                            borrowerPKH: datumObject.borrowerPKH,
                            loanAmount: datumObject.loanAmount,
                            interest: datumObject.interest,
                            deadline: datumObject.deadline,
                            datumObject,
                            utxo,
                            uniqueId: loanId,
                            status
                        });
                    }
                } catch (error) {
                    console.error("Error parsing datum:", error, "UTxO:", utxo);
                }
            }

            // Sort by status (active first, then funded, then expired) and then by deadline (ascending)
            requests.sort((a, b) => {
                // Sort by status
                const statusOrder = { active: 0, funded: 1, expired: 2 };
                const statusDiff = statusOrder[a.status] - statusOrder[b.status];
                if (statusDiff !== 0) return statusDiff;
                
                // If same status, sort by deadline (most urgent first)
                return Number(a.deadline) - Number(b.deadline);
            });

            setMyLoanRequests(requests);
        } catch (error) {
            console.error("Error fetching loan requests:", error);
            setError("Failed to fetch your loan requests. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }
    
    
    // Refresh loan data
    function refreshLoanData(): void {
        if (connection) {
            fetchMyLoanRequests(connection);
        }
    }
    
    // Format date
    function formatDate(timestamp: bigint): string {
        return new Date(Number(timestamp)).toLocaleString();
    }
    
    // Format lovelace to ADA
    function lovelaceToAda(lovelace: bigint): string {
        return (Number(lovelace) / 1_000_000).toFixed(6);
    }
    
    // Calculate days remaining until deadline
    function getDaysRemaining(deadline: bigint): number {
        const now = Date.now();
        const deadlineTime = Number(deadline);
        const diffMs = deadlineTime - now;
        return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Get status badge styling
    function getStatusBadge(status: "active" | "funded" | "expired"): { text: string, className: string } {
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
            case "expired":
                return { 
                    text: "Expired", 
                    className: "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium" 
                };
        }
    }
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
                    <p className="text-gray-600 text-lg">Track and manage your decentralized loan requests</p>
                </div>
               <div className="absolute  md:block right-0 top-0">
                    {/* Wallet Status */}
                    {!connection ? (
                        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
                            <h2 className="text-xl font-semibold mb-4 text-orange-600">Wallet connection required</h2>
                            <p className="text-gray-600">Please connect your wallet from the sidebar to view your loan applications.</p>
                        </div>
                    ) : (
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl md:p-4 p-2 shadow-2xl">
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-500 mb-6  rounded-full animate-pulse"></div>
                                <div>
                                    <p className="text-green-600 text-[13px] font-semibold">Wallet Connected</p>
                                    <p className="text-gray-600 text-[11px]">
                                        {connection.address.substring(0, 12)}...{connection.address.substring(connection.address.length - 12)}
                                    </p>
                                    <div className="mt-2">
                                        <button 
                                            onClick={refreshLoanData}
                                            className="text-green-600 hover:text-green-700 cursor-pointer text-sm font-medium flex items-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Refresh Loan Data
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
            <div className="bg-white/60 -translate-y-10 lg:translate-y-0  backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl mb-10">
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
                ) : !connection ? (
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
                            const statusBadge = getStatusBadge(loan.status);
                            const daysRemaining = getDaysRemaining(loan.deadline);
                            
                            return (
                                <div 
                                    key={loan.uniqueId} 
                                    className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 hover:border-orange-300 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]"
                                    style={{animationDelay: `${index * 100}ms`}}
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                        {/* Status & ID */}
                                        <div className="lg:col-span-3">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {loan.status === "active" ? "🟢" : loan.status === "funded" ? "💰" : "⏰"}
                                                </div>
                                                <div>
                                                    <div className="mb-2">
                                                        <span className={statusBadge.className}>
                                                            {statusBadge.text}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 text-xs">Loan ID</p>
                                                    <p className="text-gray-800 font-mono text-xs">
                                                        {loan.uniqueId.substring(0, 12)}...
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
                                                        {lovelaceToAda(loan.loanAmount)} <span className="text-sm text-gray-500">ADA</span>
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-sm mb-1">Interest</p>
                                                    <p className="text-xl font-semibold text-yellow-600">
                                                        {lovelaceToAda(loan.interest)} <span className="text-sm text-gray-500">ADA</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Deadline */}
                                        <div className="lg:col-span-3">
                                            <div>
                                                <p className="text-gray-500 text-sm mb-1">Deadline</p>
                                                <p className="text-gray-800 text-sm mb-1">{formatDate(loan.deadline)}</p>
                                                {loan.status === "expired" ? (
                                                    <span className="text-red-600 text-sm font-medium">Expired</span>
                                                ) : (
                                                    <span className={`text-sm font-medium ${daysRemaining <= 1 ? "text-red-600" : "text-green-600"}`}>
                                                        {daysRemaining} days remaining
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Transaction Link */}
                                        <div className="lg:col-span-2">
                                            <div className="text-right">
                                                <p className="text-gray-500 text-sm mb-2">Transaction</p>
                                                <a 
                                                    href={`https://preprod.cardanoscan.io/transaction/${loan.txId}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-4 py-2 rounded-xl text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    View Tx
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
            {connection && myLoanRequests.length > 0 && (
                <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                        <h3 className="text-3xl font-bold text-gray-800">Portfolio Summary</h3>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">Active Loans</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {myLoanRequests.filter(loan => loan.status === "active").length}
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
                                    <p className="text-gray-500 text-sm mb-1">Funded Loans</p>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {myLoanRequests.filter(loan => loan.status === "funded").length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xl">💰</span>
                                </div>
                            </div>
                        </div>
                        <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 hover:border-red-300 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">Expired Loans</p>
                                    <p className="text-3xl font-bold text-red-600">
                                        {myLoanRequests.filter(loan => loan.status === "expired").length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xl">⏰</span>
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