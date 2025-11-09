# HedFunds: Decentralized Peer-to-Peer Lending Platform

HedFunds is a decentralized platform built on the Hedera that connects borrowers and lenders directly. By leveraging Hedera technology, HedFunds ensures transparency, security, and trust in financial transactions. The platform includes a **frontend**, **backend**, and **smart contracts** that work seamlessly together to provide a robust and user-friendly experience. This platform isn't just meant for web3 enthusiasts, it's targeting the whole of Africa and is going to revolutionize lending on a large scale.

---

Track 1: 💸Onchain Finance & Real-World Assets (RWA)

Built for: Hedera Africa Hackathon 2025

Team: Team Hedfunds

Live Demo: https://hedfunds.vercel.app/
(Please note that if it's taking too long to register yourself on the platform kindly use this account login details to enter the dashboard and test the app:

email: enionagbo@gmail.com

password: Babatuns12*
)

Repository: https://github.com/Kars07/Hedfunds

Pitch Deck and Prd Document: https://drive.google.com/drive/folders/17Q9ZFpqkxOKRwAglxb-mTJLk8Do6gNEM



## Key Features

1. **KYC Verification**  
   - Ensures compliance with regulations and builds trust between users.
   - Users must verify their identity before accessing the platform.

2. **Credit Score System**  
   - A decentralized reputation system based on user activity, such as timely repayments and successful loans.
   - Higher credit scores improve borrowing terms.

3. **Wallet Connection**  
   - Supports Hedera wallets (e.g., HashPack, Blade Wallet) for secure on-chain transactions.
   - Users can connect their wallets to manage funds directly.

4. **Loan Management**  
   - Borrowers can request loans with specified terms (amount, interest, deadline).
   - Lenders can browse and fund loan requests.

5. **SmartContract Integration**  
   - Smart contracts handle loan requests, funding, and repayments securely.
   - All transactions are immutable and auditable on Hedera.

6. **User Authentication**  
   - Secure registration, login, and email verification.
   - Password reset functionality for account recovery.

7. **Interactive Dashboard**  
   - Users can manage their profiles, view balances, and track loan activity.
   - Includes features like wallet balance display and loan statistics.

8. **Responsive Design**  
   - Optimized for both desktop and mobile devices.
   - Smooth animations and intuitive UI for an engaging user experience.

---

## Architecture Overview

### 1. **Frontend**
   - Built with **React** , **Vite**, **TypeScript** with **TailwindCSS**.
   - Provides a user-friendly interface for borrowers and lenders.
   - Handles wallet connections, KYC verification, and loan management.
   - Communicates with the backend via REST APIs.

   **Key Components:**
   - **Authentication**: Registration, login, and email verification.
   - **Dashboard**: Profile management, wallet integration, and loan tracking.
   - **KYC Verification**: Allows users to upload documents for identity verification.

### 2. **Backend**
   - Developed using **Node.js** and **Express**.
   - Manages user authentication, KYC verification, and loan data.
   - Integrates with MongoDB for data storage.
   - Sends verification and password reset emails using **Nodemailer**.

   **Key Features:**
   - **User Management**: Registration, login, and profile updates.
   - **Loan Management**: Tracks loan requests, funding, and repayments.
   - **Security**: Implements session management and centralized error handling.

### 3. **Smart Contracts**
   - Written in **Solidity** and deployed on the Hedera Smart Contract Service (HSCS).
   - Handles the core logic for loan requests, funding, and repayments.
   - Ensures transparency and security through immutable smart contracts.
   - Utilizes Hedera's HTS (Hedera Token Service) for efficient, low-cost transfers.

   **Key Scripts:**
   - **Loan Request**: Validates loan requests submitted by borrowers.
   - **Fund Request**: Ensures proper funding of loans by lenders.
   - **Repay Request**: Manages loan repayments and updates balances.

---

## How It Works

1. **User Registration and KYC Verification**  
   - Users sign up and verify their email.
   - KYC documents are uploaded and reviewed for identity verification.

2. **Wallet Connection**  
   - Users connect their Hedera wallets (e.g., HashPack, Blade Wallet) to the platform.

3. **Loan Request**  
   - Borrowers submit loan requests with details like amount, interest, and deadline.
   - The request is stored on the blockchain via a smart contract.

4. **Loan Funding**  
   - Lenders browse loan requests and choose which ones to fund.
   - Funds are locked in a smart contract until the loan is repaid.

5. **Repayment**  
   - Borrowers repay the loan with interest before the deadline.
   - Smart contracts release funds to the lender and update the borrower's credit score.

---

## Project Structure

README.md file that describes the project and its integration between the frontend, backend, and smart contracts:

```bash
Hedfunds/
├── hedfunds_frontend/              # 🌐 Frontend (React + TypeScript + Vite + Tailwindcss)
│   ├── src/
│   │   ├── components/              # Reusable React components
│   │   ├── pages/                   # Page-level views
│   │   ├── api/                     # Axios instances & API functions
│   │   └── assets/                  # Static assets (images, logos)
│   ├── public/                      # Public files served directly
│   ├── package.json                 # Frontend dependencies and scripts
│   └── README.md                    # Frontend-specific documentation
│
├── hedfunds_backend/              # 🛠️ Backend (Node.js + Express + MongoDB)
│   ├── models/                      # Mongoose models
│   ├── routes/                      # API route definitions
│   ├── controller/                  # Route business logic
│   ├── utils/                       # Utility functions (e.g., email services)
│   ├── server.js                    # Backend entry point
│   ├── package.json                 # Backend dependencies and scripts
│   └── README.md                    # Backend-specific documentation
│
└── smartcontract/                  # ⛓️ Hedera Smart Contracts (Solidity)
    ├── contracts/                  # Solidity smart contract files
    ├── scripts/                    # Deployment and interaction scripts
    ├── test/                       # loanservice.js  
    ├── hardhat.config.js           # Hardhat configuration
    └── README.md                   # Smart contract documentation
```

---

## Installation and Setup

### Prerequisites
- **Node.js** and **npm** installed.
- **MongoDB** for backend database.
- **Hedera** Wallet (HashPack / Blade).
- **Hedera Testnet account** (for contract deployment).
- **Hardhat** for compiling and deploying smart contracts.

### Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd Hedfunds 
   ```

2. **Setup Backend**
   ```bash
   cd hedfunds_backend
   npm install
   cp .env.example .env
   ```

3. **Configure environment variables in .env and then run the server.js file**
   ```bash
   node server.js 
   ```

4. **The backend would be running on port 5000**
   ```bash
   Server running on port 5000
   Connected to Mongo Atlas!
   ```

5. **Setup Frontend**
   ```bash
   cd hedfunds_frontend
   npm install
   npm run dev
   ```

6. **Deploy smart Contracts**
   ```bash
   npm install
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network testnet
   ```

---

### Frontend port for testing: http://localhost:5173

### Backend port for testing: http://localhost:5000/

---

## Technologies Used

**Frontend:** React, Vite, TypeScript, TailwindCSS

**Backend:** Node.js, Express, MongoDB

**Smart Contracts:** Solidity, Hardhat, Hedera SDK

**Blockchain:** Hedera Hashgraph

**Email Service:** Nodemailer

**Deployment:** Hedera Testnet

---

## WHY Hedera?

- Fast finality (<5 seconds)
- Low fees (fractions of a cent)
- EVM-compatible smart contracts
- Carbon-negative network
- Enterprise-grade security and scalability

---
# Expanded Hedera Transaction Types (Detailed Reference)

Below is a comprehensive reference of the Hedera transaction types actively used in HedFunds, including purpose, implementation details, and TypeScript examples from the actual codebase.

---

## Smart Contract Interactions

### ContractExecuteTransaction - Request Loan
**Purpose:** Submit a new loan request to the smart contract with specified terms.  
**When used:** When borrowers create loan applications through the Applications page.  
**Preconditions:** 
- User must have connected wallet via WalletConnect
- Valid loan amount within credit score limits
- Valid interest and deadline parameters

**Implementation Details:**
- Function: `requestLoan(uint256 _loanAmount, uint256 _interest, uint256 _deadline)`
- Gas: 1,000,000
- Parameters: loan amount, interest, deadline timestamp (Unix seconds)
- No payable amount required

**Example from applications.tsx:**
```typescript
const requestLoanOnContract = async (
  loanAmountValue: number, 
  interestValue: number, 
  deadlineTimestamp: number
): Promise<string> => {
  const accountIdObj = AccountId.fromString(accountId);
  const transactionId = TransactionId.generate(accountIdObj);
  
  // Create contract function parameters
  const params = new ContractFunctionParameters()
    .addUint256(loanAmountValue)
    .addUint256(interestValue)
    .addUint256(deadlineTimestamp);

  // Create the transaction
  const transaction = new ContractExecuteTransaction()
    .setContractId(CONTRACT_ID) // "0.0.7091233"
    .setGas(1000000)
    .setFunction("requestLoan", params)
    .setTransactionId(transactionId);
  
  // Freeze and sign
  const frozenTx = await transaction.freezeWith(hederaClient);
  const txBytes = frozenTx.toBytes();
  
  // Send via WalletConnect (supports multiple wallet formats)
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
  
  return typeof result === 'string' ? result : JSON.stringify(result);
};
```

**Event Emitted:** `LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 loanAmount, uint256 interest, uint256 deadline)`

---

### ContractExecuteTransaction - Fund Loan (Payable)
**Purpose:** Fund an existing loan request by transferring HBAR to the smart contract.  
**When used:** When lenders browse active loans and choose to fund them on the Fund Loans page.  
**Preconditions:**
- User must not be the borrower (no self-funding)
- Loan must be in Pending status (status = 0)
- Exact loan amount must be sent with transaction

**Implementation Details:**
- Function: `fundLoan(uint256 _loanId)`
- Gas: 1,000,000
- Parameters: loan ID
- **Payable amount:** Full loan amount in HBAR
- Converts tinybar to HBAR: `amount / 100000000`

**Example from fundaloan.tsx:**
```typescript
const fundLoanOnContract = async (
  loanId: number, 
  loanAmount: string
): Promise<string> => {
  const accountIdObj = AccountId.fromString(accountId);
  const transactionId = TransactionId.generate(accountIdObj);

  // Create function parameters with loan ID
  const params = new ContractFunctionParameters().addUint256(loanId);

  // Calculate amount in HBAR (loanAmount is in tinybar)
  const amountInHbar = new Hbar(
    parseInt(loanAmount) / 100000000, 
    HbarUnit.Hbar
  );

  // Create payable transaction
  const transaction = new ContractExecuteTransaction()
    .setContractId(CONTRACT_ID)
    .setGas(1000000)
    .setFunction("fundLoan", params)
    .setPayableAmount(amountInHbar) // ⚠️ Critical: Must match loan amount
    .setTransactionId(transactionId);

  const frozenTx = await transaction.freezeWith(hederaClient);
  const txBytes = frozenTx.toBytes();

  // Multi-wallet format support
  try {
    // Try Kabila wallet format first
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
    return typeof result === 'string' ? result : JSON.stringify(result);
  } catch (firstError) {
    // Fallback to HashPack format
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
};
```

**Event Emitted:** `LoanFunded(uint256 indexed loanId, address indexed lender, uint256 amount)`

**Error Handling:**
- `IncorrectFundingAmount`: Payable amount doesn't match loan amount
- `LoanAlreadyFunded`: Loan status is not Pending
- `SelfFundingNotAllowed`: Borrower attempting to fund own loan
- `LoanNotFound`: Invalid loan ID

---

### ContractExecuteTransaction - Repay Loan (Payable)
**Purpose:** Repay a funded loan with principal + interest to release funds to lender.  
**When used:** When borrowers repay their active loans on the Loans to Repay page.  
**Preconditions:**
- User must be the borrower
- Loan must be in Funded status (status = 1)
- Full repayment amount (loan + interest) required

**Implementation Details:**
- Function: `repayLoan(uint256 _loanId)`
- Gas: 1,000,000
- Parameters: loan ID
- **Payable amount:** Loan amount + interest in HBAR
- Updates credit score based on payment timing

**Example from loanstoberepaid.tsx:**
```typescript
const repayLoanOnContract = async (
  loanId: number, 
  totalAmount: string
): Promise<string> => {
  const accountIdObj = AccountId.fromString(accountId);
  const transactionId = TransactionId.generate(accountIdObj);

  const params = new ContractFunctionParameters().addUint256(loanId);

  // Convert total amount (principal + interest) to HBAR
  const amountInHbar = new Hbar(
    parseInt(totalAmount) / 100000000, 
    HbarUnit.Hbar
  );

  const transaction = new ContractExecuteTransaction()
    .setContractId(CONTRACT_ID)
    .setGas(1000000)
    .setFunction("repayLoan", params)
    .setPayableAmount(amountInHbar) // ⚠️ Must be exact: principal + interest
    .setTransactionId(transactionId);

  const frozenTx = await transaction.freezeWith(hederaClient);
  const txBytes = frozenTx.toBytes();

  // Try multiple wallet formats for compatibility
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

  return typeof result === 'string' ? result : JSON.stringify(result);
};
```

**Credit Score Impact (determined off-chain):**
- **Early Payment** (>7 days before deadline): +50 points
- **On-Time Payment** (within deadline): +35 points  
- **Late Payment** (after deadline): -50 points

**Event Emitted:** `LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 totalAmount)`

**Error Handling:**
- `IncorrectRepaymentAmount`: Payable amount doesn't match loan + interest
- `InvalidLoanStatus`: Loan is not in Funded status
- `UnauthorizedAccess`: Caller is not the borrower

---

## Hedera Mirror Node Queries

### Fetch Contract Events via Mirror Node REST API
**Purpose:** Query historical contract events to retrieve loan data without querying contract state.  
**When used:** 
- Fetch all active loan requests (LoanRequested events)
- Fetch funded loans for a specific borrower (LoanFunded events)
- Fetch repayment history (LoanRepaid events)

**API Endpoint Pattern:**
```
https://testnet.mirrornode.hedera.com/api/v1/contracts/{CONTRACT_ID}/results/logs
```

**Query Parameters:**
- `topic0`: Event signature hash (identifies event type)
- `timestamp=gte:START&timestamp=lte:END`: Time range in nanoseconds format
- `order=desc`: Newest events first
- `limit=100`: Maximum results per page

**Example: Fetching LoanRequested Events (from fundaloan.tsx):**
```typescript
const fetchLoanRequests = async (): Promise<void> => {
  // Event signature: LoanRequested(uint256,address,uint256,uint256,uint256)
  const eventSignature = '0xf6cc19e46a340ab5888d736bfc79aef72ae92d12d7b76319d72b0abc170868e6';
  
  // Time range (last 6 days - Mirror Node 7-day limit)
  const nowSeconds = Math.floor(Date.now() / 1000);
  const sixDaysAgoSeconds = nowSeconds - (6 * 24 * 60 * 60);
  
  // Format as seconds.nanoseconds (e.g., "1234567890.000000000")
  const startTime = `${sixDaysAgoSeconds}.000000000`;
  const endTime = `${nowSeconds}.999999999`;
  
  const mirrorNodeUrl = 
    `https://testnet.mirrornode.hedera.com/api/v1/contracts/${CONTRACT_ID}/results/logs` +
    `?topic0=${eventSignature}` +
    `&timestamp=gte:${startTime}` +
    `&timestamp=lte:${endTime}` +
    `&order=desc` +
    `&limit=100`;
  
  const response = await fetch(mirrorNodeUrl);
  const eventsData = await response.json();
  
  // Process events
  if (eventsData.logs && eventsData.logs.length > 0) {
    for (const log of eventsData.logs) {
      const topics = log.topics || [];
      const data = log.data;
      
      // Parse indexed parameters from topics
      const loanIdHex = topics[1];
      const loanId = parseInt(loanIdHex, 16);
      
      const borrowerHex = topics[2];
      const borrowerAccountId = hexToAccountId(borrowerHex);
      
      // Parse non-indexed parameters from data field
      let dataHex = data.startsWith('0x') ? data.substring(2) : data;
      
      // Each parameter is 32 bytes (64 hex chars)
      const loanAmountHex = dataHex.substring(0, 64);
      const interestHex = dataHex.substring(64, 128);
      const deadlineHex = dataHex.substring(128, 192);
      
      const loanAmount = BigInt('0x' + loanAmountHex).toString();
      const interest = BigInt('0x' + interestHex).toString();
      const deadline = parseInt(deadlineHex, 16);
      
      // Verify loan is still active by checking status
      const isActive = await checkLoanStatus(loanId);
      
      if (isActive) {
        loans.push({
          loanId,
          borrower: borrowerAccountId,
          loanAmount,
          interest,
          deadline,
          status: 0,
          createdAt: Math.floor(new Date(log.timestamp).getTime() / 1000)
        });
      }
    }
  }
};
```

**Example: Fetching LoanFunded Events (from loanstoberepaid.tsx):**
```typescript
const fetchFundedLoans = async (): Promise<void> => {
  // Event signature: LoanFunded(uint256,address,uint256)
  const eventSignature = '0xbd7ef6c6281278f6c8ac4ae9ef2f205b52425813c288dd47c377cb6b59c5076e';
  
  const nowSeconds = Math.floor(Date.now() / 1000);
  const sixDaysAgoSeconds = nowSeconds - (6 * 24 * 60 * 60);
  
  const startTime = `${sixDaysAgoSeconds}.000000000`;
  const endTime = `${nowSeconds}.999999999`;
  
  const mirrorNodeUrl = 
    `https://testnet.mirrornode.hedera.com/api/v1/contracts/${CONTRACT_ID}/results/logs` +
    `?topic0=${eventSignature}` +
    `&timestamp=gte:${startTime}` +
    `&timestamp=lte:${endTime}` +
    `&order=desc` +
    `&limit=100`;
  
  const eventsResponse = await fetch(mirrorNodeUrl);
  const eventsData = await eventsResponse.json();
  
  if (eventsData.logs && eventsData.logs.length > 0) {
    for (const log of eventsData.logs) {
      const topics = log.topics || [];
      const loanIdHex = topics[1];
      const loanId = parseInt(loanIdHex, 16);
      
      // Get full loan details from contract
      const loanDetails = await getLoanDetails(loanId);
      
      // Only show loans where current user is borrower and status is Funded
      if (loanDetails && loanDetails.borrower === accountId && loanDetails.status === 1) {
        loans.push({
          ...loanDetails,
          fundedAt: Math.floor(new Date(log.timestamp).getTime() / 1000)
        });
      }
    }
  }
};
```

---

### Contract State Query via Mirror Node
**Purpose:** Query current loan state without executing a transaction (view function).  
**When used:** 
- Verify if a loan is still active (status check)
- Get complete loan details (borrower, lender, amounts, deadline, status)

**API Endpoint:**
```
https://testnet.mirrornode.hedera.com/api/v1/contracts/call
```

**Method:** POST  
**Request Body:**
```json
{
  "data": "0x{functionSelector}{encodedParams}",
  "to": "0x{contractAddressInHex}",
  "estimate": false,
  "gas": 100000
}
```

**Example: Get Loan Details (from loanstoberepaid.tsx):**
```typescript
const getLoanDetails = async (loanId: number): Promise<FundedLoan | null> => {
  // Function selector: getLoan(uint256) = 0x504006ca
  const functionSelector = '504006ca';
  const paddedLoanId = loanId.toString(16).padStart(64, '0');
  const callData = '0x' + functionSelector + paddedLoanId;

  // Convert contract ID "0.0.7091233" to hex address
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

  const result = await response.json();
  
  if (result.result) {
    const resultHex = result.result.startsWith('0x') 
      ? result.result.substring(2) 
      : result.result;
    
    // Parse loan struct (each field is 32 bytes = 64 hex chars)
    // Struct: (address borrower, address lender, uint256 loanAmount, 
    //          uint256 interest, uint256 deadline, uint8 status, uint256 createdAt)
    
    // Addresses are right-aligned in 32 bytes, take last 40 hex chars (20 bytes)
    const borrowerHex = '0x' + resultHex.substring(24, 64);
    const lenderHex = '0x' + resultHex.substring(88, 128);
    
    const loanAmountHex = resultHex.substring(128, 192);
    const interestHex = resultHex.substring(192, 256);
    const deadlineHex = resultHex.substring(256, 320);
    const statusHex = resultHex.substring(320, 384);
    const createdAtHex = resultHex.substring(384, 448);

    // Convert to readable values
    const borrower = await resolveAccountId(borrowerHex);
    const lender = await resolveAccountId(lenderHex);
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
};
```

**Example: Check Loan Active Status (from fundaloan.tsx):**
```typescript
const checkLoanStatus = async (loanId: number): Promise<boolean> => {
  // Query getLoan(uint256) and check if status == 0 (Pending)
  const functionSelector = '504006ca';
  const paddedLoanId = loanId.toString(16).padStart(64, '0');
  const callData = '0x' + functionSelector + paddedLoanId;

  const contractIdParts = CONTRACT_ID.split('.');
  const contractNum = parseInt(contractIdParts[2]);
  const contractHex = '0x' + contractNum.toString(16).padStart(40, '0');

  const response = await fetch(
    'https://testnet.mirrornode.hedera.com/api/v1/contracts/call',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: callData,
        to: contractHex,
        estimate: false,
        gas: 100000
      })
    }
  );

  const result = await response.json();
  
  if (result.result) {
    const resultHex = result.result.startsWith('0x') 
      ? result.result.substring(2) 
      : result.result;
    
    // Status field is at byte offset 160 (5 * 32 bytes)
    const statusHex = resultHex.substring(320, 384);
    const status = parseInt(statusHex, 16);
    
    // Status 0 = Pending (active), 1 = Funded, 2 = Repaid, 3 = Defaulted
    return status === 0;
  }

  return true; // Assume active if check fails
};
```

---

## WalletConnect Integration

### Multi-Wallet Format Support
**Purpose:** Support multiple Hedera wallet providers (Kabila, HashPack, Blade) with different transaction signing formats.  
**When used:** All contract execution transactions require wallet signatures.

**Supported Formats:**

1. **Kabila Wallet Format:**
```typescript
{
  method: "hedera_signAndExecuteTransaction",
  params: {
    signerAccountId: `hedera:${HEDERA_NETWORK}:${accountId}`,
    transactionList: Buffer.from(txBytes).toString("base64")
  }
}
```

2. **HashPack Wallet Format:**
```typescript
{
  method: "hedera_executeTransaction",
  params: {
    signerId: accountId,
    transactionBytes: Buffer.from(txBytes).toString("base64")
  }
}
```

3. **Blade Wallet Format:**
```typescript
{
  method: "hedera_signTransaction",
  params: {
    signerAccountId: accountId,
    transactionBytes: Buffer.from(txBytes).toString("base64")
  }
}
```

**Implementation Strategy:** Try each format sequentially with fallback handling.

---

## Utility Functions

### Hedera Account ID Conversion
**Purpose:** Convert between hex addresses (used in contract events) and Hedera account IDs (0.0.N format).

**Hex to Account ID:**
```typescript
const hexToAccountId = (hex: string): string => {
  // Remove '0x' prefix
  let cleanHex = hex.startsWith('0x') ? hex.substring(2) : hex;
  
  // Pad to even length
  if (cleanHex.length % 2 !== 0) {
    cleanHex = '0' + cleanHex;
  }
  
  // Remove leading zeros
  const trimmedHex = cleanHex.replace(/^0+/, '') || '0';
  
  // Convert to decimal using BigInt (handles large numbers)
  const bigIntValue = BigInt('0x' + trimmedHex);
  const accountNum = bigIntValue.toString(10);
  
  // Return in Hedera format: shard.realm.num
  return `0.0.${accountNum}`;
};
```

**Account ID Resolution (with Mirror Node fallback):**
```typescript
const resolveAccountId = async (hex: string): Promise<string> => {
  const cleanHex = hex.startsWith('0x') ? hex.substring(2) : hex;
  
  // Simple case: address with many leading zeros
  if (cleanHex.match(/^0{24,}/)) {
    const trimmed = cleanHex.replace(/^0+/, '') || '0';
    return `0.0.${parseInt(trimmed, 16)}`;
  }
  
  // Complex case: Query Mirror Node for account lookup
  try {
    const response = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts/${hex}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data.account) {
        return data.account; // Returns "0.0.N" format
      }
    }
  } catch (error) {
    console.error('Error resolving account:', error);
  }
  
  return hex; // Return original if resolution fails
};
```

---

## Best Practices & Operational Notes

### Transaction Management
1. **Always generate unique transaction IDs** using `TransactionId.generate(accountId)`
2. **Freeze transactions** before converting to bytes: `transaction.freezeWith(hederaClient)`
3. **Set appropriate gas limits**: 1,000,000 is safe for most contract calls
4. **Handle wallet disconnection** gracefully with session event listeners

### Error Handling
1. **Wrap all blockchain calls** in try-catch blocks
2. **Parse transaction results** flexibly (string or JSON object)
3. **Implement retry logic** for wallet connection timeouts (120s default)
4. **Validate input parameters** before contract calls to save gas

### Event Processing
1. **Use event signatures** to filter relevant logs from Mirror Node
2. **Limit time ranges** to 6 days (Mirror Node has 7-day limit)
3. **Parse indexed vs non-indexed parameters** correctly:
   - Indexed: In `topics` array
   - Non-indexed: In `data` field (concatenated 32-byte chunks)
4. **Verify loan status** with state queries before displaying to users

### State Synchronization
1. **Refresh data after transactions** with 3-second delay for blockchain finality
2. **Use Mirror Node for historical data**, contract state queries for current status
3. **Cache credit scores** per user to minimize API calls
4. **Implement loading states** for better UX during blockchain interactions

### Security Considerations
1. **Validate all user inputs** before submitting to contract
2. **Prevent self-funding** by checking borrower ≠ lender
3. **Require exact payable amounts** to prevent under/over-funding
4. **Use WalletConnect** for secure transaction signing (never expose private keys)
5. **Implement credit score checks** before loan approval

### Performance Optimization
1. **Batch Mirror Node queries** with appropriate limits (100 events max)
2. **Process only relevant events** (filter by user context)
3. **Use view functions** for read operations instead of transactions
4. **Implement pagination** for large event logs (not yet implemented but recommended)

---

## Contract ABI Reference

For complete ABI details, see `hedera_abi_interface.txt` which includes:
- All read-only view functions
- All state-changing functions
- Event signatures and parameters
- Custom error types

**Key Functions:**
- `requestLoan(uint256,uint256,uint256)` - 0xedadbbfe
- `fundLoan(uint256)` payable - 0x846b909a
- `repayLoan(uint256)` payable - 0xab7b1c89
- `getLoan(uint256)` view - 0x504006ca
- `isLoanActive(uint256)` view - 0xb03590be

**Key Events:**
- `LoanRequested` - 0xf6cc19e46a340ab5888d736bfc79aef72ae92d12d7b76319d72b0abc170868e6
- `LoanFunded` - 0xbd7ef6c6281278f6c8ac4ae9ef2f205b52425813c288dd47c377cb6b59c5076e
- `LoanRepaid` - 0x... (check contract for exact signature)

## Dependencies

- **express:** Web framework for Node.js.
- **mongoose:** MongoDB object modeling tool.
- **nodemailer:** Email sending utility.
- **bcryptjs:** Password hashing.
- **dotenv:** Environment variable management.
- **express-validator:** Input validation.
- **helmet:** Security middleware.
- **cors:** Cross-Origin Resource Sharing.
- **express-session:** Session management.
- **express-rate-limit:** Rate limiting middleware.

---

## License

This project is licensed under the MIT License.
