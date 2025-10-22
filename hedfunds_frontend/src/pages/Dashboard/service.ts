import {
  AccountId,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractCallQuery,
  Hbar,
  HbarUnit,
  Client,
  TransactionId,
} from "@hashgraph/sdk";
import { Web3Modal } from "@web3modal/standalone";
import SignClient from "@walletconnect/sign-client";
import { getSdkError } from "@walletconnect/utils";
import { SessionTypes } from "@walletconnect/types";
import { ethers, providers } from "ethers";



// Augment Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Loan status enum
export enum LoanStatus {
  REQUESTED = 0,
  FUNDED = 1,
  REPAID = 2,
  DEFAULTED = 3,
}

// Loan interface
export interface Loan {
  borrower: string;
  lender: string;
  loanAmount: string;
  interest: string;
  deadline: string;
  status: LoanStatus;
  createdAt: string;
}

// WalletConnect configuration
const WALLETCONNECT_PROJECT_ID = "cb09000e29ac8eb293421c4501e4ecb9";
const CONTRACT_ID = "0.0.7091233";
const HEDERA_NETWORK: string = "testnet"; // Change to "mainnet" for production

export class HederaLoanService {
  private signClient: InstanceType<typeof SignClient> | null = null;
  private session: SessionTypes.Struct | null = null;
  private accountId: string | null = null;
  private client: Client | null = null;
private ethersProvider: providers.Web3Provider | null = null;

  private walletType: "walletconnect" | "metamask" | null = null;

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize Hedera client for queries and transactions
   */
  private initializeClient(): void {
    if (HEDERA_NETWORK === "mainnet") {
      this.client = Client.forMainnet();
    } else {
      this.client = Client.forTestnet();
    }
    this.client.setDefaultMaxTransactionFee(new Hbar(1, HbarUnit.Hbar));
  }

  /**
   * Initialize WalletConnect client
   */
  async initializeWalletConnect(): Promise<void> {
    this.signClient = await SignClient.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: "P2P Loan DApp",
        description: "Peer-to-peer lending platform on Hedera",
        url: window.location.origin,
        icons: ["https://walletconnect.com/walletconnect-logo.png"],
      },
    });

    const sessions = this.signClient.session.getAll();
    if (sessions.length > 0) {
      this.session = sessions[sessions.length - 1];
      const accounts = this.session.namespaces.hedera?.accounts || [];
      if (accounts.length > 0) {
        this.accountId = accounts[0].split(":")[2];
        this.walletType = "walletconnect";
      }
    }
  }

  /**
   * Connect wallet using WalletConnect
   */
  async connectWalletConnect(): Promise<string> {
    if (!this.signClient) {
      await this.initializeWalletConnect();
    }

    if (!this.signClient) {
      throw new Error("Failed to initialize WalletConnect");
    }

    try {
      const { uri, approval } = await this.signClient.connect({
        requiredNamespaces: {
          hedera: {
            methods: ["hedera_executeTransaction", "hedera_signTransaction"],
            chains: [`hedera:${HEDERA_NETWORK}`],
            events: [],
          },
        },
      });

      if (uri) {
        const web3Modal = new Web3Modal({
          projectId: WALLETCONNECT_PROJECT_ID,
          walletConnectVersion: 2,
        });
        await web3Modal.openModal({ uri });
      }

      this.session = await approval();
      const accounts = this.session.namespaces.hedera?.accounts || [];
      if (accounts.length === 0) {
        throw new Error("No accounts found in session");
      }

      this.accountId = accounts[0].split(":")[2];
      if (!this.accountId.match(/^\d+\.\d+\.\d+$/)) {
        throw new Error("Invalid Hedera account ID format");
      }
      this.walletType = "walletconnect";

      return this.accountId;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect wallet: ${error.message}`);
      } else {
        throw new Error("Failed to connect wallet: Unknown error");
      }
    }
  }

  /**
   * Connect wallet using MetaMask
   */
  async connectMetaMask(): Promise<string> {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected. Please install it or use a Hedera-compatible wallet.");
    }

    try {
      this.ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await this.ethersProvider.send("eth_requestAccounts", []);
      if (accounts.length === 0) {
        throw new Error("No MetaMask accounts found");
      }

      

      // Convert EVM address to Hedera account ID (simplified placeholder)
      this.accountId = await this.evmAddressToHederaAccountId(accounts[0]);
      this.walletType = "metamask";
      return this.accountId;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect MetaMask: ${error.message}`);
      } else {
        throw new Error("Failed to connect MetaMask: Unknown error");
      }
    }
  }

  /**
   * Convert EVM address to Hedera account ID (simplified placeholder)
   */
  private async evmAddressToHederaAccountId(evmAddress: string): Promise<string> {
    // Placeholder: Replace with actual mapping logic (e.g., contract call or API)
    return "0.0.123456"; // Example testnet account ID
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    if (this.walletType === "walletconnect" && this.signClient && this.session) {
      await this.signClient.disconnect({
        topic: this.session.topic,
        reason: getSdkError("USER_DISCONNECTED"),
      });
      this.session = null;
    }
    this.accountId = null;
    this.walletType = null;
    this.ethersProvider = null;
  }

  /**
   * Get connected account ID
   */
  getAccountId(): string | null {
    return this.accountId;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.accountId !== null;
  }

  /**
   * Execute a contract transaction
   */
  private async executeTransaction(
    functionName: string,
    params: ContractFunctionParameters,
    loanAmount?: string,
    interest?: string,
    deadline?: string,
    payableAmount?: Hbar
  ): Promise<any> {
    if (!this.isConnected() || !this.accountId) {
      throw new Error("Wallet not connected");
    }

    if (!this.client) {
      throw new Error("Hedera client not initialized");
    }

    const accountId = AccountId.fromString(this.accountId);
    const transactionId = TransactionId.generate(accountId);
    console.log("Generated Transaction ID:", transactionId.toString());

    const transaction = new ContractExecuteTransaction()
      .setContractId(CONTRACT_ID)
      .setGas(1000000)
      .setFunction(functionName, params)
      .setTransactionId(transactionId);

    if (payableAmount) {
      transaction.setPayableAmount(payableAmount);
    }

    console.log("Transaction before freeze:", transaction.toString());
    const txBytes = await transaction.freezeWith(this.client);
    console.log("Transaction bytes length:", txBytes.toBytes().length);
    const txBytesArray = txBytes.toBytes();

    if (this.walletType === "walletconnect" && this.signClient && this.session) {
      console.log("Sending request to WalletConnect with topic:", this.session.topic);
      const result = await this.signClient.request({
        topic: this.session.topic,
        chainId: `hedera:${HEDERA_NETWORK}`,
        request: {
          method: "hedera_executeTransaction",
          params: {
            transactionBytes: Buffer.from(txBytesArray).toString("base64"),
          },
        },
      });
      console.log("Transaction result:", result);
      return result;
    } else if (this.walletType === "metamask" && this.ethersProvider) {
      const signer = this.ethersProvider.getSigner();
      const contractAddress = ethers.utils.getAddress(CONTRACT_ID.replace("0.0.", "0x")); // Convert to EVM format
      const contractAbi = [
        "function requestLoan(uint256 _loanAmount, uint256 _interest, uint256 _deadline) returns (uint256)",
        // Add other ABI functions as needed
      ];
      const contract = new ethers.Contract(contractAddress, contractAbi, signer);

if (!loanAmount || !interest || !deadline) {
  throw new Error("Missing loan parameters.");
}

  const tx = await contract.requestLoan(
    ethers.BigNumber.from(parseInt(loanAmount)),
    ethers.BigNumber.from(parseInt(interest)),
    ethers.BigNumber.from(parseInt(deadline))
  );


      console.log("Transaction hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);
      return receipt;
    } else {
      throw new Error("No supported wallet connected");
    }
  }

  /**
   * Query contract (read-only)
   */
  private async queryContract(
    functionName: string,
    params: ContractFunctionParameters
  ): Promise<any> {
    if (!this.client) {
      throw new Error("Hedera client not initialized");
    }

    const query = new ContractCallQuery()
      .setContractId(CONTRACT_ID)
      .setGas(100000)
      .setFunction(functionName, params);

    const result = await query.execute(this.client);
    return result;
  }

  // Example method using the updated executeTransaction
  async requestLoan(loanAmount: string, interest: string, deadline: string): Promise<string> {
    const params = new ContractFunctionParameters()
      .addInt64(parseInt(loanAmount))
      .addInt64(parseInt(interest))
      .addInt64(parseInt(deadline));

    const result = await this.executeTransaction("requestLoan", params, loanAmount, interest, deadline);
    if (this.walletType === "walletconnect") {
      return result.toString(); // Adjust based on actual return type
    } else if (this.walletType === "metamask") {
      const receipt = result as ethers.ContractReceipt;
      // Extract loanId from event logs (adjust based on ABI event structure)
      const loanRequestedEvent = receipt.logs.find((log) => log.topics[0] === ethers.utils.id("LoanRequested(uint256,address,uint256,uint256,uint256)"));
      if (loanRequestedEvent) {
        return ethers.BigNumber.from(loanRequestedEvent.topics[1]).toString();
      }
      throw new Error("Loan ID not found in transaction receipt");
    }
    throw new Error("Unsupported wallet type");
  }

  /**
   * Edit an existing loan request
   * @param loanId ID of the loan to edit
   * @param newLoanAmount New loan amount
   * @param newInterest New interest rate
   * @param newDeadline New deadline
   */
  async editLoanRequest(
    loanId: string,
    newLoanAmount: string,
    newInterest: string,
    newDeadline: string
  ): Promise<void> {
    const params = new ContractFunctionParameters()
      .addUint256(Number(loanId))
      .addUint256(Number(newLoanAmount))
      .addUint256(Number(newInterest))
      .addUint256(Number(newDeadline));

    await this.executeTransaction("editLoanRequest", params);
  }

  /**
   * Fund a loan request
   * @param loanId ID of the loan to fund
   * @param amount Amount to send (must match loan amount) in tinybars
   */
  async fundLoan(loanId: string, amount: string): Promise<void> {
    const params = new ContractFunctionParameters().addUint256(Number(loanId));

    const hbarAmount = Hbar.fromTinybars(amount);
    await this.executeTransaction("fundLoan", params, undefined, undefined, undefined, hbarAmount);
  }

  /**
   * Repay a loan
   * @param loanId ID of the loan to repay
   * @param amount Total amount to repay (principal + interest) in tinybars
   */
  async repayLoan(loanId: string, amount: string): Promise<void> {
    const params = new ContractFunctionParameters().addUint256(Number(loanId));

    const hbarAmount = Hbar.fromTinybars(amount);
    await this.executeTransaction("repayLoan", params, undefined, undefined, undefined, hbarAmount);
  }

  /**
   * Mark a loan as defaulted
   * @param loanId ID of the loan to mark as defaulted
   */
  async markAsDefaulted(loanId: string): Promise<void> {
    const params = new ContractFunctionParameters().addUint256(Number(loanId));

    await this.executeTransaction("markAsDefaulted", params);
  }

  // ==================== READ FUNCTIONS ====================

  /**
   * Calculate total debt for a loan (principal + interest)
   * @param loanId ID of the loan
   */
  async calculateDebt(loanId: string): Promise<string> {
    const params = new ContractFunctionParameters().addUint256(Number(loanId));

    const result = await this.queryContract("calculateDebt", params);
    return result.getUint256(0).toString();
  }

  /**
   * Get loan details
   * @param loanId ID of the loan
   */
  async getLoan(loanId: string): Promise<Loan> {
    const params = new ContractFunctionParameters().addUint256(Number(loanId));

    const result = await this.queryContract("getLoan", params);

    return {
      borrower: result.getAddress(0),
      lender: result.getAddress(1),
      loanAmount: result.getUint256(2).toString(),
      interest: result.getUint256(3).toString(),
      deadline: result.getUint256(4).toString(),
      status: result.getUint8(5) as LoanStatus,
      createdAt: result.getUint256(6).toString(),
    };
  }

  /**
   * Check if a loan is active
   * @param loanId ID of the loan
   */
  async isLoanActive(loanId: string): Promise<boolean> {
    const params = new ContractFunctionParameters().addUint256(Number(loanId));

    const result = await this.queryContract("isLoanActive", params);
    return result.getBool(0);
  }

  /**
   * Get total number of loans
   */
  async getLoanCounter(): Promise<string> {
    const params = new ContractFunctionParameters();

    const result = await this.queryContract("loanCounter", params);
    return result.getUint256(0).toString();
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Convert HBAR to tinybars
   */
  static hbarToTinybar(hbar: number): string {
    return Math.floor(hbar * 100_000_000).toString();
  }

  /**
   * Convert tinybars to HBAR
   */
  static tinybarToHbar(tinybar: string): number {
    return Number(tinybar) / 100_000_000;
  }

  /**
   * Format interest rate for display
   */
  static formatInterest(interest: string): string {
    return (Number(interest) / 100).toFixed(2) + "%";
  }

  /**
   * Format date from Unix timestamp
   */
  static formatDeadline(timestamp: string): string {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  }

  /**
   * Get loan status name
   */
  static getStatusName(status: LoanStatus): string {
    return LoanStatus[status];
  }

  /**
   * Check if deadline has passed
   */
  static isDeadlinePassed(deadline: string): boolean {
    return Date.now() / 1000 > Number(deadline);
  }

  /**
   * Calculate days until deadline
   */
  static daysUntilDeadline(deadline: string): number {
    const now = Date.now() / 1000;
    const deadlineSeconds = Number(deadline);
    const secondsRemaining = deadlineSeconds - now;
    return Math.floor(secondsRemaining / (24 * 60 * 60));
  }
}

// Export singleton instance
export const hederaLoanService = new HederaLoanService();
