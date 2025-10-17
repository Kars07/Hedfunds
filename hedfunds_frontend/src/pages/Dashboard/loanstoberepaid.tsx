import React, { useState, useEffect } from "react";
import { Address, LucidEvolution, WalletApi, validatorToAddress, PaymentKeyHash, SpendingValidator, UTxO, Redeemer, Data, credentialToAddress } from "@lucid-evolution/lucid";
import { useWallet } from "./Dashboard";
import CreditScoreGuide from "./CreditScoreGuide";

const FundRequestValidatorScript: SpendingValidator = {
    type: "PlutusV2",
    script: "59028801010029800aba2aba1aba0aab9faab9eaab9dab9a488888896600264653001300800198041804800cdc3a400530080024888966002600460106ea800e2653001300d00198069807000cdc3a40009112cc004c004c030dd500444c8c8cc8966002602a00713259800980318089baa0018acc004c018c044dd5003c4ca60026eb8c0580064602e60300033016301337540109112cc006600266e3c00cdd7180c980b1baa001a50a51405115980099b87375a603260340086eb4c008c058dd5000c5660026644b30013232598009807000c528c566002602600313259800980a180d1baa3007301b3754603c60366ea8016266e24004012266e200040110191bad301d301a375400514a080c1018180c1baa001301b30183754603660306ea800a26464b3001300e0018a508acc004c04c006264b30013014301a3754600e60366ea8c01cc06cdd5002c4cdc4802000c4cdc4002000a032375a603a60346ea800a2945018203030183754002603660306ea8c010c060dd50014528202c3019301a301a301a301a301a301a301a3016375401c6eb4c064c068c068c068c058dd5000c56600264660020026eb0c068c06cc06cc06cc06cc06cc06cc06cc06cc05cdd5007912cc00400629422b30013371e6eb8c06c0040162946266004004603800280b101944cdd7980c980b1baa30193016375400a01914a080a22941014452820288a5040503012375401b16404116404064660020026eb0c054c048dd5005112cc004006298103d87a80008992cc004cdd7980b980a1baa00100a899ba548000cc0580052f5c113300300330180024048602c00280a22c8090dd698090009bae30120023012001300d375401116402c3009375400716401c300800130033754011149a26cac80081"
};

const FundLoanAddress: Address = validatorToAddress("Preprod", FundRequestValidatorScript);
// const API_URL = "http://localhost:9000/funded_loans.php";
const API_URL = "https://swiftfund-6b61.onrender.com/api/loans";
type Connection = {
    api: WalletApi;
    lucid: LucidEvolution;
    address: Address;
    pkh: PaymentKeyHash;
};
type FundedLoan = {
    txId: string;
    outputIndex: number;
    lenderPKH: string;
    loanAmount: bigint;
    borrowerPKH?: string;
    interest?: bigint;
    deadline?: bigint;
    utxo: UTxO;
    fundedLoanId: string; // Unique identifier for this specific funded loan UTXO
    originalLoanId?: string; // Reference to the original loan request UTXO ID
    repaymentInfo?: {
        repaidAt: number;
        repaymentTxHash: string;
    };
};
// credit score data type
type CreditScoreData = {
    current_score: number;
    total_loans: number;
    on_time_payments: number;
    early_payments: number;
    late_payments: number;
};

//repayment response type
type RepaymentResponse = {
    status: string;
    message: string;
    creditScore?: number;
    paymentCategory?: string;
    paymentDetails?: {
        category: string;
        days: number;
        loan_duration: number;
    };
};
// API Response Types
type ApiBorrowerLoan = {
    loanId: string;
    fundedLoanId: string;
    lenderPKH: string;
    borrowerPKH: string;
    loanAmount: string;
    interest: string;
    deadline: string;
    txHash: string;
    isActive: boolean;
    repaymentInfo?: {
        repaidAt: number;
        repaymentTxHash: string;
    };
};

const fundloanredeemerschema = Data.Object({
    lenderPKH: Data.Bytes(),
    loanAmount: Data.Integer(),
});
type redeemerType = Data.Static<typeof fundloanredeemerschema>;
const redeemerType = fundloanredeemerschema as unknown as redeemerType;
// Define repayment redeemer schema
const repayLoanRedeemerSchema = Data.Object({
    lenderPKH: Data.Bytes(),
    borrowerPKH: Data.Bytes(),
    loanAmount: Data.Integer(),
    interest: Data.Integer(),
});
type RepayRedeemerType = Data.Static<typeof repayLoanRedeemerSchema>;
const RepayRedeemerType = repayLoanRedeemerSchema as unknown as RepayRedeemerType;
const LoanToBeRepaid: React.FC = () => {
    const { connection, wallets, connectWallet, isConnecting } = useWallet();    
    const [fundedLoans, setFundedLoans] = useState<FundedLoan[]>([]);
    const [creditScore, setCreditScore] = useState<CreditScoreData | null>(null);
    const [paymentFeedback, setPaymentFeedback] = useState<{
    category: string;
    details: string;
} | null>(null);
    const [showCreditScore, setShowCreditScore] = useState<boolean>(false);
    const [loansToRepay, setLoansToRepay] = useState<FundedLoan[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingRepay, setLoadingRepay] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Create a unique identifier for a specific UTxO 
    function createUtxoId(txId: string, outputIndex: number): string {
        return `${txId}-${outputIndex}`;
    }
    // Effect to fetch loans when connection changes
    useEffect(() => {
        if (connection) {
            fetchLoansToRepay(connection);
            fetchCreditScore(connection.pkh); // Add this line
            testApiEndpoints(connection.pkh);
        }
    }, [connection]);
    // Fetch funded loans and filter those that need to be repaid
async function fetchLoansToRepay(conn: Connection): Promise<void> {
    try {
        setIsLoading(true);
        const { lucid, pkh } = conn;
        
        console.log("🚀 Starting fetchLoansToRepay for PKH:", pkh);
        
        // First, fetch all funded loans
        console.log("📊 Fetching all funded loans from blockchain...");
        const allFundedLoans = await fetchFundedLoans(lucid);
        console.log("📊 Total funded loans found on blockchain:", allFundedLoans.length);
        setFundedLoans(allFundedLoans);
        
        // Fetch borrower's loans from API
        console.log("🔍 Fetching borrower loans from API...");
        const borrowerLoans = await fetchBorrowerLoansFromApi(pkh);
        console.log("📋 Borrower loans returned from API:", borrowerLoans.length);
        
        if (borrowerLoans.length === 0) {
            console.log("⚠️ No borrower loans found in API. Possible causes:");
            console.log("   - PKH doesn't match database records");
            console.log("   - User has no loans");
            console.log("   - API endpoint issue");
            console.log("   - Database connection issue");
        }
        
        // Filter to get only active loans (not repaid)
        const loansNeedingRepayment = borrowerLoans.filter(loan => {
            const isActive = loan.isActive && !loan.repaymentInfo;
            console.log(`📝 Loan ${loan.fundedLoanId}: isActive=${loan.isActive}, hasRepaymentInfo=${!!loan.repaymentInfo}, needsRepayment=${isActive}`);
            return isActive;
        });
        
        console.log("🎯 Loans needing repayment after filtering:", loansNeedingRepayment.length);
        console.log("📋 Filtered loans:", loansNeedingRepayment);
        
        // Converting API loans to FundedLoan format
        console.log("🔄 Converting API loans to FundedLoan format...");
        const activeBorrowerFundedLoans = await convertApiLoansToFundedLoans(loansNeedingRepayment, lucid);
        console.log("✅ Converted loans:", activeBorrowerFundedLoans.length);
        console.log("📋 Final loans to repay:", activeBorrowerFundedLoans);
        
        setLoansToRepay(activeBorrowerFundedLoans);
    } catch (error) {
        console.error("💥 Error fetching loans to repay:", error);
        setError("Failed to fetch loans to repay. Please try again.");
    } finally {
        setIsLoading(false);
    }
}

async function testApiEndpoints(borrowerPKH: string) {
    console.log("🧪 Testing API endpoints...");
    
    // Test different possible endpoint formats
    const endpointsToTest = [
        `${API_URL}/borrower/${borrowerPKH}`,
        `${API_URL}/loans/borrower/${borrowerPKH}`,
        `${API_URL}?action=getBorrowerLoans&borrowerPKH=${borrowerPKH}`,
    ];
    
    for (const endpoint of endpointsToTest) {
        try {
            console.log(`🔍 Testing endpoint: ${endpoint}`);
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            console.log(`📡 ${endpoint} - Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint} - Response:`, data);
            } else {
                console.log(`❌ ${endpoint} - Error: ${response.statusText}`);
            }
        } catch (error) {
            console.log(`💥 ${endpoint} - Exception:`, error);
        }
    }
    
    // Also test POST method (in case your API expects POST)
    try {
        console.log("🔍 Testing POST method...");
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'getBorrowerLoans',
                borrowerPKH: borrowerPKH
            }),
        });
        
        console.log(`📡 POST method - Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ POST method - Response:`, data);
        } else {
            console.log(`❌ POST method - Error: ${response.statusText}`);
        }
    } catch (error) {
        console.log(`💥 POST method - Exception:`, error);
    }
}
async function fetchBorrowerLoansFromApi(borrowerPKH: string): Promise<ApiBorrowerLoan[]> {
    try {
        console.log("🔍 Fetching loans for borrower PKH:", borrowerPKH);
        console.log("🌐 API URL:", `${API_URL}/borrower/${borrowerPKH}`);
        
        const response = await fetch(`${API_URL}/borrower/${borrowerPKH}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        console.log("📡 Response status:", response.status);
        console.log("📡 Response ok:", response.ok);
        
        if (!response.ok) {
            console.error("❌ HTTP Error:", response.status, response.statusText);
            return [];
        }
        
        const data = await response.json();
        console.log("📦 Raw API response:", data);
        
        if (data.status === 'success') {
            console.log("✅ API success - loans found:", data.loans?.length || 0);
            console.log("📋 Loans data:", data.loans);
            return data.loans || [];
        } else {
            console.error("❌ API error:", data.message);
            console.log("🔍 Full error response:", data);
            return [];
        }
    } catch (error) {
        console.error("💥 Fetch error:", error);
        console.error("🔍 Error details:", {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        return [];
    }
}
    async function convertApiLoansToFundedLoans(apiLoans: ApiBorrowerLoan[], lucidInstance: LucidEvolution): Promise<FundedLoan[]> {
        // Get all UTXOs at fund loan address
        const fundedUtxos: UTxO[] = await lucidInstance.utxosAt(FundLoanAddress);
        const result: FundedLoan[] = [];   
        for (const loan of apiLoans) {
            // Find matching UTXO by txHash
            const matchingUtxo = fundedUtxos.find(utxo => utxo.txHash === loan.txHash);
            if (!matchingUtxo) continue;
            try {
                if (!matchingUtxo.datum) continue;
                const datumObject = Data.from(matchingUtxo.datum, redeemerType);
                result.push({
                    txId: matchingUtxo.txHash,
                    outputIndex: matchingUtxo.outputIndex,
                    lenderPKH: loan.lenderPKH,
                    loanAmount: BigInt(loan.loanAmount),
                    borrowerPKH: loan.borrowerPKH,
                    interest: BigInt(loan.interest),
                    deadline: BigInt(loan.deadline),
                    utxo: matchingUtxo,
                    fundedLoanId: loan.fundedLoanId,
                    originalLoanId: loan.loanId,
                    repaymentInfo: loan.repaymentInfo
                });
            } catch (error) {
                console.error("Error parsing funded loan datum:", error, "UTxO:", matchingUtxo);
            }
        }   
        return result;
    }
    async function fetchFundedLoans(lucidInstance: LucidEvolution): Promise<FundedLoan[]> {
        const fundedUtxos: UTxO[] = await lucidInstance.utxosAt(FundLoanAddress);
        console.log("UTXOs at fund loan address:", fundedUtxos);
        const fundedLoans: FundedLoan[] = [];
        for (const utxo of fundedUtxos) {
            if (!utxo.datum) continue;
            try {
                const datumObject = Data.from(utxo.datum, redeemerType);
                // Create unique identifier for this funded loan UTXO
                const fundedLoanId = createUtxoId(utxo.txHash, utxo.outputIndex);
                fundedLoans.push({
                    txId: utxo.txHash,
                    outputIndex: utxo.outputIndex,
                    lenderPKH: datumObject.lenderPKH,
                    loanAmount: datumObject.loanAmount,
                    utxo,
                    fundedLoanId
                });
            } catch (error) {
                console.error("Error parsing funded loan datum:", error, "UTxO:", utxo);
            }
        }
        return fundedLoans;
    }
async function fetchCreditScore(userPKH: string): Promise<void> {
    try {
        const response = await fetch(`${API_URL}/credit-score/${userPKH}`, {
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
        }
    } catch (error) {
        console.error("Error fetching credit score:", error);
    }
}

    // Repay loan function
    async function repayLoan(fundedLoan: FundedLoan): Promise<void> {
        if (!connection) {
            setError("Please connect your wallet first");
            return;
        }
        try {
            setError(null);
            setTxHash(null);
            setPaymentFeedback(null);
            setLoadingRepay(fundedLoan.fundedLoanId);   
            const { lucid, pkh } = connection;
            // Ensure we're the borrower
            if (fundedLoan.borrowerPKH !== pkh) {
                throw new Error("You are not the borrower of this loan");
            }
            // Create the repayment redeemer
            const repayRedeemer: RepayRedeemerType = {
                lenderPKH: fundedLoan.lenderPKH,
                borrowerPKH: pkh,
                loanAmount: fundedLoan.loanAmount,
                interest: fundedLoan.interest || BigInt(0)
            };
            
            const redeemerData: Redeemer = Data.to<RepayRedeemerType>(repayRedeemer, RepayRedeemerType);
            
            // Get the lender address from PKH
            const lenderAddressDetails = {
                paymentCredential: {
                    hash: fundedLoan.lenderPKH,
                    type: "Key" as const
                },
                stakeCredential: undefined,
                network: "Preprod" as const
            };
            
            const lenderAddress = credentialToAddress("Preprod", lenderAddressDetails.paymentCredential);
            
            console.log("Lender Address:", lenderAddress);
            console.log("Funded Loan UTXO:", fundedLoan.utxo);
            
            // Calculate total repayment amount (loan + interest)
            const repaymentAmount = fundedLoan.loanAmount + (fundedLoan.interest || BigInt(0));
            
            // Create and submit the transaction
            const tx = await lucid
                .newTx()
                .readFrom([fundedLoan.utxo])
                .addSignerKey(pkh)
                .attach.SpendingValidator(FundRequestValidatorScript)
                .pay.ToAddress(lenderAddress, { lovelace: repaymentAmount })
                .validFrom(Date.now() - 1000000)
                .complete();
            
            const signedTx = await tx.sign.withWallet().complete();
            const txHash = await signedTx.submit();
            
            console.log("Loan repaid successfully. Transaction hash:", txHash);
            setTxHash(txHash);

            // Refresh full credit score data after repayment
            setTimeout(() => {
                if (connection) {
                    fetchCreditScore(connection.pkh);
                }
            }, 2000);

            // After successful repayment, record it in the API 
            await recordLoanRepayment(fundedLoan.fundedLoanId, txHash);

            // Wait for a moment and then refresh the loan data
            setTimeout(() => {
                if (connection) {
                    fetchLoansToRepay(connection);
                }
            }, 10000);
            
        } catch (error) {
            console.error("Error repaying loan:", error);
            setError(`Failed to repay loan: ${error instanceof Error ? error.message : String(error)}`);
            setPaymentFeedback(null);
        } finally {
            setLoadingRepay(null);
        }
    }
    
async function recordLoanRepayment(fundedLoanId: string, repaymentTxHash: string): Promise<void> {
    try {
        // Use the REST endpoint
        const response = await fetch(`${API_URL}/repay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fundedLoanId,
                repaidAt: Date.now(),
                repaymentTxHash
            }),
        });       
        
        const data: RepaymentResponse = await response.json();
        
        if (data.status === 'success') {
            // Update credit score if provided
            if (data.creditScore) {
                // Refresh credit score data
                if (connection) {
                    await fetchCreditScore(connection.pkh);
                }
            }
            
            // Set payment feedback for user
            if (data.paymentDetails) {
                const { category, days, loan_duration } = data.paymentDetails;
                let feedbackMessage = '';
                
                switch (category) {
                    case 'early':
                        if (days >= loan_duration * 0.25) {
                            feedbackMessage = `Excellent! Very early repayment (+100 credit points)`;
                        } else if (days >= loan_duration * 0.50) {
                            feedbackMessage = `Great! Early repayment (+75 credit points)`;
                        } else {
                            feedbackMessage = `Good! Early repayment (+50 credit points)`;
                        }
                        break;
                    case 'on_time':
                        if (days >= loan_duration * 0.75) {
                            feedbackMessage = `Great! Well ahead of deadline (+50 credit points)`;
                        } else if (days > 5) {
                            feedbackMessage = `Good! Repaid with time to spare (+35 credit points)`;
                        } else if (days >= 1) {
                            feedbackMessage = `Nice! Repaid before deadline (+15 credit points)`;
                        } else {
                            feedbackMessage = `Repaid on deadline day (no credit penalty)`;
                        }
                        break;
                    case 'late':
                        if (days === 1) {
                            feedbackMessage = `1 day late (-5 credit points)`;
                        } else if (days <= 5) {
                            feedbackMessage = `${Math.round(days)} days late (-30 credit points)`;
                        } else {
                            feedbackMessage = `${Math.round(days)} days late (-50 credit points)`;
                        }
                        break;
                }
                
                setPaymentFeedback({
                    category,
                    details: feedbackMessage
                });
            }
        } else {
            console.error("API error when recording repayment:", data.message);
        }
    } catch (error) {
        console.error("Error recording loan repayment in API:", error);
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
    function daysRemaining(deadline: bigint): number {
        const now = Date.now();
        const deadlineTime = Number(deadline);
        const diffMs = deadlineTime - now;
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    // Check if a deadline is expired
    function isDeadlineExpired(deadline: bigint): boolean {
        return Number(deadline) < Date.now();
    }
    
    function getCreditScoreColor(score: number): string {
        if (score >= 750) return 'text-green-600';
        if (score >= 650) return 'text-blue-600';
        if (score >= 550) return 'text-yellow-600';
        return 'text-red-600';
    }

    // Function to get credit score label
    function getCreditScoreLabel(score: number): string {
        if (score >= 750) return 'Excellent';
        if (score >= 650) return 'Good';
        if (score >= 550) return 'Fair';
        return 'Poor';
    }

    return (
    <div className="min-h-screen text-gray-900 relative overflow-hidden">

        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute -bottom-8 left-40 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative z-10 p-4 pt-5 max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-2 md:mb-12">
                <div className="mb-6 lg:mb-0">
                    <h1 className="text-4xl mt-3 md:mt-0 lg:text-5xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent mb-4">
                        Loans to Repay
                    </h1>
                    <p className="text-gray-600 text-lg">Manage your active loans and maintain your credit score</p>
                </div>
                <div className="absolute md:block right-0 top-0">
                    {/* Wallet Connection */}
                    {!connection ? (
                        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
                            <h2 className="text-xl font-semibold mb-4 text-orange-600">Connect Wallet</h2>
                            <div className="flex flex-wrap gap-3">
                                {wallets.map((wallet) => (
                                    <button
                                        key={wallet.name}
                                        onClick={() => connectWallet(wallet)}
                                        className="group flex items-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                    >
                                        {wallet.icon && (
                                            <img src={wallet.icon} alt={wallet.name} className="w-5 h-5 mr-3 group-hover:animate-spin" />
                                        )}
                                        Connect {wallet.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-r from-green-100 to-emerald-100 backdrop-blur-xl border border-green-200 rounded-2xl p-2 md:p-6 shadow-2xl">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <div>
                                    <p className="text-green-700 font-semibold">Wallet Connected</p>
                                    <p className="text-gray-600 text-sm">
                                        {connection.address.substring(0, 12)}...{connection.address.substring(connection.address.length - 12)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
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
                    <p className="text-gray-600 text-sm break-all mb-3">Hash: {txHash}</p>
                    
                    {/* Payment feedback */}
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
                    
                    {/* Credit score update */}
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
            {connection && (
            <div className="md:mb-8 mb-2  bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl md:p-8 p-4 shadow-lg">
                {/* Header with Toggle Button */}
                <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                    <h3 className="text-2xl font-bold text-gray-800">Credit Score</h3>
                </div>
                <button
                    onClick={() => setShowCreditScore(!showCreditScore)}
                    className="bg-gradient-to-r from-orange-600 to-orange-600 hover:from-orange-700 hover:to-orange-700 text-white md:px-4 px-2 py-2 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                    {showCreditScore ? 'Hide Details' : 'Show Details'}
                </button>
                </div>

                {/* Score Overview */}
                <div className="flex items-center  px-2 gap-6 mb-4">
                {creditScore ? (
                    <>
                    <div className="text-center">
                        <span
                        className={`text-4xl font-bold ${getCreditScoreColor(
                            creditScore.current_score
                        )}`}
                        >
                        {creditScore.current_score}
                        </span>
                    </div>
                    <div
                        className={`px-4 py-2 rounded-xl font-medium border ${
                        creditScore.current_score >= 750
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : creditScore.current_score >= 650
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : creditScore.current_score >= 550
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                    >
                        {getCreditScoreLabel(creditScore.current_score)}
                    </div>
                    </>
                ) : (
                    <div className="animate-pulse flex items-center space-x-4">
                    <div className="h-12 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                )}
                </div>

                {/* Details with Animation */}
                <div
                className={`transition-all duration-500 ease-in-out ${
                    showCreditScore && creditScore ? 'mb-6' : 'mb-0'
                }`}
                >
                <div
                    className={`grid grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden transition-all duration-500 ease-in-out transform ${
                    showCreditScore && creditScore
                        ? 'opacity-100 max-h-96 scale-100'
                        : 'opacity-0 max-h-0 scale-95 pointer-events-none'
                    }`}
                    style={{
                    transitionProperty: 'opacity, transform, max-height, margin',
                    }}
                >
                    {creditScore && (
                    <>
                        <div className="bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-sm font-semibold text-gray-600 mb-2">
                            Total Loans
                        </div>
                        <div className="text-2xl font-bold text-zinc-700">
                            {creditScore.total_loans}
                        </div>
                        </div>
                        <div className="bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-sm font-semibold text-gray-600 mb-2">
                            On Time
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                            {creditScore.on_time_payments}
                        </div>
                        </div>
                        <div className="bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-sm font-semibold text-gray-600 mb-2">
                            Early
                        </div>
                        <div className="text-2xl font-bold text-zinc-700">
                            {creditScore.early_payments}
                        </div>
                        </div>
                        <div className="bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-sm font-semibold text-gray-600 mb-2">
                            Late
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                            {creditScore.late_payments}
                        </div>
                        </div>
                    </>
                    )}
                </div>
                </div>
            </div>
            )}


            {/* Credit Score Guide */}
            {connection && <CreditScoreGuide />}

            {/* Main Content - Loans to Repay */}
            <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 -translate-y-10 md:-translate-y-55 shadow-2xl">
                <div className="flex items-center space-x-4 mb-8">
                    <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                    <h2 className="text-3xl font-bold text-gray-800">Your Active Loans</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                </div>

                {!connection ? (
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
                        <p className="text-gray-600 text-lg">Loading your active loans...</p>
                    </div>
                ) : loansToRepay.length === 0 ? (
                    <div className="text-center py-16 bg-gray-100/60 rounded-2xl">
                        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                            <span className="text-3xl">✅</span>
                        </div>
                        <p className="text-gray-700 text-xl">No active loans to repay</p>
                        <p className="text-gray-500 mt-2">All caught up! Great job managing your finances</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {loansToRepay.map((loan, index) => {
                            const interest = loan.interest || BigInt(0);
                            const deadline = loan.deadline || BigInt(0);
                            const totalToRepay = loan.loanAmount + interest;
                            const isExpired = isDeadlineExpired(deadline);
                            const daysLeft = daysRemaining(deadline);
                            
                            return (
                                <div 
                                    key={loan.fundedLoanId} 
                                    className={`group backdrop-blur-xl border rounded-2xl p-6 transition-all duration-500 transform hover:scale-[1.02] ${
                                        isExpired 
                                            ? 'bg-gradient-to-r from-red-50/80 to-red-100/80 border-red-300 hover:border-red-400 hover:shadow-2xl' 
                                            : 'bg-gradient-to-r from-white/80 to-gray-50/80 border-gray-200 hover:border-orange-300 hover:shadow-2xl'
                                    }`}
                                    style={{animationDelay: `${index * 100}ms`}}
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                        {/* Lender Info */}
                                        <div className="lg:col-span-3">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {loan.lenderPKH.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-gray-600 text-sm">Lender</p>
                                                    <p className="text-gray-800 font-mono text-sm">
                                                        {loan.lenderPKH.substring(0, 8)}...{loan.lenderPKH.substring(loan.lenderPKH.length - 8)}
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
                                                        {lovelaceToAda(loan.loanAmount)} <span className="text-sm text-gray-500">ADA</span>
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-sm mb-1">Interest</p>
                                                    <p className="text-lg font-semibold text-yellow-600">
                                                        {lovelaceToAda(interest)} <span className="text-sm text-gray-500">ADA</span>
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-sm mb-1">Total to Repay</p>
                                                    <p className="text-xl font-bold text-purple-600">
                                                        {lovelaceToAda(totalToRepay)} <span className="text-sm text-gray-500">ADA</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Deadline Status */}
                                        <div className="lg:col-span-3">
                                            <div className="text-center">
                                                <p className="text-gray-500 text-sm mb-1">Deadline</p>
                                                <p className="text-gray-800 text-sm mb-2">{formatDate(deadline)}</p>
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
                                                disabled={loadingRepay === loan.fundedLoanId}
                                                className={`w-full px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    isExpired 
                                                        ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white' 
                                                        : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white'
                                                }`}
                                            >
                                                {loadingRepay === loan.fundedLoanId ? (
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
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-gray-400 font-mono">
                                                ID: {loan.fundedLoanId.substring(0, 16)}...
                                            </p>
                                            {loan.originalLoanId && (
                                                <p className="text-xs text-gray-400 font-mono">
                                                    From: {loan.originalLoanId.substring(0, 8)}...
                                                </p>
                                            )}
                                        </div>
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