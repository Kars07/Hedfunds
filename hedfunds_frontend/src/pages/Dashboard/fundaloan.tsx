import React, { useState, useEffect } from "react";
import { Address, LucidEvolution, validatorToAddress, SpendingValidator, UTxO, Redeemer, Data, credentialToAddress } from "@lucid-evolution/lucid";
import { useWallet } from "./Dashboard";

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

// const API_URL = "https://swiftfundsloantracker.42web.io/funded_loans.php";
// const API_URL = "http://localhost:8080/Swiftfund/SwiftFunds/funded_loans.php";
const API_URL = "https://swiftfund-6b61.onrender.com/api/loans";
// const API_URL = "http://localhost:8080/Swiftfund/SwiftFunds/funded_loans.php";

type LoanRequest = {
    txId: string;
    outputIndex: number;
    borrowerPKH: string;
    loanAmount: bigint;
    interest: bigint; 
    deadline: bigint;
    datumObject: any;
    utxo: UTxO;
    uniqueId: string;
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
    fundedLoanId: string;
    originalLoanId?: string;
    repaymentInfo?: {
        repaidAt: number;
        repaymentTxHash: string;
    };
};
type CreditScoreData = {
    current_score: number;
    total_loans: number;
    on_time_payments: number;
    early_payments: number;
    late_payments: number;
};

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

// Utility function for API calls
async function apiCall(endpoint: string, method: string, data?: any) {
  try {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API error: ${error}`);
    throw error;
  }
}

const FundLoan: React.FC = () => {
    const { connection, wallets, connectWallet, isConnecting } = useWallet();
    const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingFund, setLoadingFund] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [creditScores, setCreditScores] = useState<Map<string, CreditScoreData>>(new Map());
    
    // Fetch loan data when connection changes
    useEffect(() => {
        if (connection) {
            // First register the user (or get existing user) with the API
            registerUser(connection.address, connection.pkh)
                .then(() => fetchLoanData(connection.lucid))
                .catch(err => {
                    console.error("Error registering user:", err);
                    setError("Failed to connect to the server. Please try again.");
                });
        }
    }, [connection]);

    // Register or get user from database
async function registerUser(address: string, pkh: string): Promise<void> {
 await apiCall('users', 'POST', { address, pkh });
}
async function fetchCreditScore(userPKH: string): Promise<CreditScoreData | null> {
  try {
const response = await fetch(`${API_URL}/credit-score/${userPKH}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});

    const data = await response.json();
    if (data.status === 'success') {
      return data.creditScore;
    } else {
      console.error("Error fetching credit score:", data.message);
      return null;
    }
  } catch (error) {
    console.error("Error fetching credit score:", error);
    return null;
  }
}
    function getCreditScoreColor(score: number): string {
        if (score >= 750) return 'text-green-600';
        if (score >= 650) return 'text-blue-600';
        if (score >= 550) return 'text-yellow-600';
        return 'text-red-600';
    }

    function getCreditScoreLabel(score: number): string {
        if (score >= 750) return 'Excellent';
        if (score >= 650) return 'Good';
        if (score >= 550) return 'Fair';
        return 'Poor';
    }

    // Create a unique identifier for a specific UTxO
    function createUtxoId(txId: string, outputIndex: number): string {
        return `${txId}-${outputIndex}`;
    }

async function fetchLoanData(lucidInstance: LucidEvolution): Promise<void> {
    try {
        setIsLoading(true);
        
        // First, fetch ALL funded loans, not just the user's
        const fundedLoansData = await fetchFundedLoans(lucidInstance);
        
        // Then fetch loan requests and filter out the funded ones
        await fetchLoanRequests(lucidInstance, fundedLoansData);
    } catch (error) {
        console.error("Error fetching loan data:", error);
        setError("Failed to fetch loan data. Please try again.");
    } finally {
        setIsLoading(false);
    }
}

async function fetchFundedLoans(lucidInstance: LucidEvolution): Promise<FundedLoan[]> {
    // Fetch on-chain data - UTXOs at fund loan address
    const fundedUtxos: UTxO[] = await lucidInstance.utxosAt(FundLoanAddress);
    console.log("UTXOs at fund loan address:", fundedUtxos);
    
    // Collect the active funded UTXOs from the blockchain
    const activeFundedUTXOs = [];
    
    for (const utxo of fundedUtxos) {
        if (!utxo.datum) continue;
        
        try {
            const datumObject = Data.from(utxo.datum, redeemerType);
            const fundedLoanId = createUtxoId(utxo.txHash, utxo.outputIndex);
            
            activeFundedUTXOs.push({
                id: fundedLoanId,
                txHash: utxo.txHash,
                outputIndex: utxo.outputIndex
            });
        } catch (error) {
            console.error("Error parsing funded loan datum:", error, "UTxO:", utxo);
        }
    }
    
    // fetching ALL funded loans data from the database API, not just the user's
    let fundedLoans: FundedLoan[] = [];
    try {
        //sync the on-chain status with the database
await apiCall('verify', 'POST', { 
    activeFundedUTXOs 
});
        
        // Then fetch ALL loans, not just for the current user
        const response = await apiCall('funded', 'GET');
        
        if (response.status === 'success') {
            // Transform the API data to match our FundedLoan type
            fundedLoans = response.loans.map((loan: any) => ({
                txId: loan.txHash,
                outputIndex: loan.fundedWith.length > 0 ? loan.fundedWith[0].outputIndex : 0,
                lenderPKH: loan.lenderPKH,
                loanAmount: BigInt(loan.loanAmount),
                borrowerPKH: loan.borrowerPKH,
                interest: BigInt(loan.interest),
                deadline: BigInt(loan.deadline),
                utxo: {} as UTxO, // This will be populated if the loan is still on-chain
                fundedLoanId: loan.fundedLoanId,
                originalLoanId: loan.loanId,
                repaymentInfo: loan.repaymentInfo
            }));
            
            // Match up the on-chain UTXOs with our database records
            for (const loan of fundedLoans) {
                const matchingUtxo = fundedUtxos.find(utxo => 
                    createUtxoId(utxo.txHash, utxo.outputIndex) === loan.fundedLoanId
                );
                
                if (matchingUtxo) {
                    loan.utxo = matchingUtxo;
                }
            }
        }
    } catch (error) {
        console.error("Error fetching funded loans from API:", error);
    }
    
    return fundedLoans;
}

async function fetchAllFundedLoanIds(lucidInstance: LucidEvolution): Promise<Set<string>> {
    // Create a set to store all funded loan IDs
    const fundedLoanOriginalIds = new Set<string>();
    
    try {
        // Make API call to get all funded loan IDs
        const response = await apiCall('funded/ids', 'GET');
        
        if (response.status === 'success' && Array.isArray(response.loanIds)) {
            response.loanIds.forEach((id: string) => {
                fundedLoanOriginalIds.add(id);
            });
        }
        
        // including any UTXOs currently at the FundLoanAddress
        // This ensures we catch any newly funded loans that might not be in the database yet
        const fundedUtxos: UTxO[] = await lucidInstance.utxosAt(FundLoanAddress);
        
        for (const utxo of fundedUtxos) {
            if (!utxo.datum) continue;
            
            try {
                const datumObject = Data.from(utxo.datum, redeemerType);
               const response = await apiCall(`original/${createUtxoId(utxo.txHash, utxo.outputIndex)}`, 'GET');
                
                if (response.status === 'success' && response.originalLoanId) {
                    fundedLoanOriginalIds.add(response.originalLoanId);
                }
            } catch (error) {
                console.error("Error parsing funded loan datum:", error);
            }
        }
    } catch (error) {
        console.error("Error fetching funded loan IDs:", error);
    }
    
    return fundedLoanOriginalIds;
}

async function fetchLoanRequests(lucidInstance: LucidEvolution, fundedLoansData: FundedLoan[]): Promise<void> {
    try {
        const utxosAtScript: UTxO[] = await lucidInstance.utxosAt(LoanRequestAddress);
        console.log("UTxOs at loan request address:", utxosAtScript);

        const requests: LoanRequest[] = [];
        const currentTime = Date.now();
        
        // Get ALL funded loan IDs, not just those funded by the current user
        const fundedLoanOriginalIds = await fetchAllFundedLoanIds(lucidInstance);
        console.log("All funded loan IDs:", Array.from(fundedLoanOriginalIds));

        // Track unique borrower PKHs to fetch credit scores
        const borrowerPKHs = new Set<string>();

        for (const utxo of utxosAtScript) {
            if (!utxo.datum) continue;
            
            try {
                const datumObject = Data.from(utxo.datum, BorrowerDatum);
                
                // Skip expired loan requests
                if (Number(datumObject.deadline) < currentTime) {
                    console.log(`Loan request with deadline ${new Date(Number(datumObject.deadline)).toLocaleString()} has expired, skipping`);
                    continue;
                }
                
                // Create a unique identifier for this loan request UTXO
                const loanId = createUtxoId(utxo.txHash, utxo.outputIndex);
                
                // Check if this specific loan request has been funded by ANYONE
                if (fundedLoanOriginalIds.has(loanId)) {
                    console.log(`Loan request ${loanId} has been funded, skipping`);
                    continue;
                }

                // Add borrower PKH to our set for credit score fetching
                borrowerPKHs.add(datumObject.borrowerPKH);

                requests.push({
                    txId: utxo.txHash,
                    outputIndex: utxo.outputIndex,
                    borrowerPKH: datumObject.borrowerPKH,
                    loanAmount: datumObject.loanAmount,
                    interest: datumObject.interest,
                    deadline: datumObject.deadline,
                    datumObject,
                    utxo,
                    uniqueId: loanId
                });
            } catch (error) {
                console.error("Error parsing datum:", error, "UTxO:", utxo);
            }
        }

        setLoanRequests(requests);

        // Fetch credit scores for all unique borrowers
        const newCreditScores = new Map<string, CreditScoreData>();
        
        for (const borrowerPKH of borrowerPKHs) {
            const creditScore = await fetchCreditScore(borrowerPKH);
            if (creditScore) {
                newCreditScores.set(borrowerPKH, creditScore);
            }
        }
        
        setCreditScores(newCreditScores);

    } catch (error) {
        console.error("Error fetching loan requests:", error);
        setError("Failed to fetch loan requests. Please try again.");
    }
}

    // Fund loan function
    async function fundLoan(loanRequest: LoanRequest): Promise<void> {
        if (!connection) {
            setError("Please connect your wallet first");
            return;
        }

        try {
            setError(null);
            setTxHash(null);
            
            if (connection.pkh === loanRequest.borrowerPKH) {
                setError("You cannot fund your own loan request");
                return;
            }

            setLoadingFund(loanRequest.txId);
            const { lucid, pkh } = connection;
            
            // Create the redeemer
            const FundRedeemer: redeemerType = {
                lenderPKH: pkh,
                loanAmount: loanRequest.loanAmount
            };
            
            const fundredeem: Redeemer = Data.to<redeemerType>(FundRedeemer, redeemerType);
            
            // Get the borrower address from PKH
            const borrowerAddressDetails = {
                paymentCredential: {
                    hash: loanRequest.borrowerPKH,
                    type: "Key" as const
                },
                stakeCredential: undefined,
                network: "Preprod" as const
            };
            
            const BorrowerAddress = credentialToAddress("Preprod", borrowerAddressDetails.paymentCredential);
            
            console.log("Borrower Address:", BorrowerAddress);
            console.log("Loan Request UTXO:", loanRequest.utxo);
            
            // Create and submit the transaction
            const tx = await lucid
                .newTx()
                .readFrom([loanRequest.utxo])
                .addSignerKey(pkh)
                .attach.SpendingValidator(loanRequestValidatorScript)
                .attach.SpendingValidator(FundRequestValidatorScript)
                .pay.ToAddress(BorrowerAddress, { lovelace: loanRequest.loanAmount })
                .pay.ToContract(FundLoanAddress, { kind: "inline", value: fundredeem })
                .validFrom(Date.now() - 1000000)
                .complete();
            
            const signedTx = await tx.sign.withWallet().complete();
            const txHash = await signedTx.submit();
            
            console.log("Loan funded successfully. Transaction hash:", txHash);
            setTxHash(txHash);

            // Get funding UTXO details
            const fundingTx = await lucid.awaitTx(txHash);
            console.log("Funding transaction confirmed:", fundingTx);
            
            // Find the output index of the funding at the FundLoanAddress
            let fundedOutputIndex = -1;
            const txOutputs = await lucid.utxosAt(FundLoanAddress);
            for (let i = 0; i < txOutputs.length; i++) {
                if (txOutputs[i].txHash === txHash) {
                    fundedOutputIndex = txOutputs[i].outputIndex;
                    break;
                }
            }

            // Create unique funded loan identifier using the specific funding transaction
            const fundedLoanId = createUtxoId(txHash, fundedOutputIndex >= 0 ? fundedOutputIndex : 0);
            
            // Record the funded loan in the database
            try {
                await apiCall('funded', 'POST', {
    loanId: loanRequest.uniqueId,
    fundedLoanId,
    lenderPKH: pkh,
    borrowerPKH: loanRequest.borrowerPKH,
    loanAmount: loanRequest.loanAmount.toString(),
    interest: loanRequest.interest.toString(),
    deadline: loanRequest.deadline.toString(),
    txHash,
    fundedAt: Date.now(),
    fundedWith: [{
        txHash,
        outputIndex: fundedOutputIndex >= 0 ? fundedOutputIndex : 0
    }]
});
                
                console.log('Loan funding recorded in database');
            } catch (error) {
                console.error('Failed to record loan funding in database:', error);
                // Note: We don't set an error here as the transaction itself succeeded
            }
            
            // Wait for a moment and then refresh the loan data
            setTimeout(() => {
                fetchLoanData(lucid);
            }, 10000);
            
        } catch (error) {
            console.error("Error funding loan:", error);
            setError(`Failed to fund loan: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoadingFund(null);
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
        interface GetCreditScoreBg {
            (score: number): string;
        }

const getCreditScoreBg: GetCreditScoreBg = (score) => {
    if (score >= 750) return 'bg-green-50 border-green-200';
    if (score >= 650) return 'bg-blue-50 border-blue-200';
    if (score >= 550) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
};

return (
    <div className="min-h-screen mt-3 text-gray-900 relative overflow-hidden">

        {/* Animated Background Elements */}
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
                    <p className="text-gray-600 text-lg">Discover and fund promising loan opportunities in the decentralized ecosystem</p>
                </div>

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
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 backdrop-blur-xl border border-green-200 rounded-2xl p-6 shadow-2xl">
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
                    <p className="text-gray-600 text-sm break-all">Hash: {txHash}</p>
                </div>
            )}

            {/* Main Content */}
            <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center space-x-4 mb-8">
                    <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                    <h2 className="text-3xl font-bold text-gray-800">Active Loan Requests</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                </div>

                {isLoading ? (
                    <div className="text-center py-16">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-400 rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2" style={{animationDirection: 'reverse'}}></div>
                        </div>
                        <p className="text-gray-600 text-lg">Scanning blockchain for loan requests...</p>
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
                            const creditScore = creditScores.get(loan.borrowerPKH);
                            const isOwnLoan = connection && loan.borrowerPKH === connection.pkh;
                            
                            return (
                                <div 
                                    key={loan.uniqueId} 
                                    className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 hover:border-orange-300 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]"
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
                                                        disabled={!connection || loadingFund === loan.txId}
                                                        className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {loadingFund === loan.txId ? (
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

                                    {/* Loan ID (smaller text at bottom) */}
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-xs text-gray-400 font-mono">
                                            ID: {loan.uniqueId.substring(0, 16)}...
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