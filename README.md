# HedFunds: Decentralized Peer-to-Peer Lending Platform

HedFunds is a decentralized platform built on the Hedera that connects borrowers and lenders directly. By leveraging Hedera technology, HedFunds ensures transparency, security, and trust in financial transactions. The platform includes a **frontend**, **backend**, and **smart contracts** that work seamlessly together to provide a robust and user-friendly experience. This platform isn't just meant for web3 enthusiasts, it's targeting the whole of Africa and is going to revolutionize lending on a large scale.

---

Track 1: 💸Onchain Finance & Real-World Assets (RWA)

Built for: Hedera Africa Hackathon 2025

Team: Team Hedfunds

Live Demo: https://hedfunds.vercel.app/
(Please note that if it's taking too long to register yourself on the platform kindly use this account login details:
email:
password:
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

## Expanded Hedera Transaction Types (Detailed Reference)

Below is a practical, copy-ready reference of the Hedera transaction types used across Hedfunds, including purpose, when to use them, preconditions/roles, and compact TypeScript examples using @hashgraph/sdk. Add these to developer docs or use them to build examples.

### AccountCreateTransaction  
**Purpose:** create new Hedera accounts for testing (issuers, custodians).  
**When used:** dev/test bootstrapping; not normally used in production (accounts created by users/custodians off-chain).  
**Preconditions:** root operator with enough HBAR to fund new account.  
**Example:**
```ts
import { AccountCreateTransaction, PrivateKey } from "@hashgraph/sdk";

const newKey = PrivateKey.generate();
const tx = await new AccountCreateTransaction()
  .setKey(newKey.publicKey)
  .setInitialBalance(10) // tinybars or Hbar as appropriate in real code
  .execute(client);

const receipt = await tx.getReceipt(client);
console.log("New account:", receipt.accountId?.toString());
```

### TopicCreateTransaction (HCS topic)  
**Purpose:** create an HCS topic for immutable event logs (issuance, governance, redemptions).  
**When used:** bootstrap step to create the project's HCS stream.  
**Preconditions:** operator account. Consider access control via submitKey.  
**Example:**
```ts
import { TopicCreateTransaction } from "@hashgraph/sdk";

const tx = await new TopicCreateTransaction().execute(client);
const receipt = await tx.getReceipt(client);
const topicId = receipt.topicId!.toString();
console.log("HCS topic:", topicId);
```

### TopicMessageSubmitTransaction (HCS message)  
**Purpose:** submit a signed message (or event hash) to an HCS topic for immutable timestamped logging.  
**When used:** log TOKEN_ISSUED, TOKEN_MINTED, BURN, redemption proofs, governance proposals.  
**Best practice:** store large payloads off-chain (IPFS, S3) and submit only JSON with pointers and SHA256 hash.  
**Example:**
```ts
import { TopicMessageSubmitTransaction, TopicId } from "@hashgraph/sdk";

const message = JSON.stringify({ event: "TOKEN_ISSUED", tokenId: "0.0.123", hash: "sha256:..." });
await new TopicMessageSubmitTransaction({ topicId: TopicId.fromString("0.0.x"), message }).execute(client);
```

### TokenCreateTransaction (HTS)  
**Purpose:** create an HTS token for an RWA or fund share with metadata and controls (treasury, KYC, freeze, supplyKey).  
**When used:** when an issuer initially mints a token representing an asset.  
**Preconditions:** treasury account exists and will hold initial supply; supplyKey or auto-mint controls set.  
**Example:**
```ts
import { TokenCreateTransaction } from "@hashgraph/sdk";

const tx = await new TokenCreateTransaction()
  .setTokenName("HedFunds-Asset-123")
  .setTokenSymbol("HFA123")
  .setTreasuryAccountId(treasuryAccountId)
  .setInitialSupply(0)
  .setDecimals(0)
  .setAdminKey(adminKey)
  .setSupplyKey(supplyKey)
  .execute(client);

const receipt = await tx.getReceipt(client);
console.log("tokenId:", receipt.tokenId?.toString());
```

### TokenMintTransaction  
**Purpose:** mint additional token supply (if supplyKey allows).  
**When used:** mint on-collateralization or when issuing shares.  
**Preconditions:** caller must sign with supplyKey.  
**Example:**
```ts
import { TokenMintTransaction } from "@hashgraph/sdk";

await new TokenMintTransaction()
  .setTokenId(tokenId)
  .setAmount(1000) // integer amount according to decimals
  .execute(client);
```

### TokenBurnTransaction  
**Purpose:** burn tokens to reduce supply (redemption, retire asset).  
**When used:** redemption flows, removal of tokens representing consumed / retired assets.  
**Preconditions:** signed by supplyKey or burning allowed by issuer policy.  
**Example:**
```ts
import { TokenBurnTransaction } from "@hashgraph/sdk";

await new TokenBurnTransaction()
  .setTokenId(tokenId)
  .setAmount(100)
  .execute(client);
```

### TokenAssociateTransaction  
**Purpose:** associate an account with an HTS token before transfers can occur.  
**When used:** user onboarding; every account must associate before receiving a token.  
**Preconditions:** account signs the association; otherwise the association fails.  
**Example:**
```ts
import { TokenAssociateTransaction } from "@hashgraph/sdk";

await new TokenAssociateTransaction()
  .setAccountId(userAccountId)
  .setTokenIds([tokenId])
  .freezeWith(client)
  .sign(userPrivateKey)
  .execute(client);
```

### TransferTransaction (HBAR & HTS transfers)  
**Purpose:** perform HBAR transfers and token transfers in the same atomic transaction.  
**When used:** token transfers between users, settlements (HBAR used for fees/settlement legs) and internal treasury flows.  
**Preconditions:** accounts must be associated for token transfers.  
**Example:**
```ts
import { TransferTransaction, Hbar } from "@hashgraph/sdk";

await new TransferTransaction()
  .addTokenTransfer(tokenId, treasuryAccountId, -10)
  .addTokenTransfer(tokenId, userAccountId, 10)
  .addHbarTransfer(treasuryAccountId, Hbar.fromTinybars(-1000))
  .addHbarTransfer(feeCollectorAccountId, Hbar.fromTinybars(1000))
  .execute(client);
```

### TokenFreezeTransaction / TokenUnfreezeTransaction  
**Purpose:** freeze or unfreeze token transfers on a per-account basis for compliance or custodial control.  
**When used:** when custodians need to temporarily restrict transfers pending KYC/AML checks.  
**Preconditions:** token must have a freezeKey set during creation; the transaction must be signed by freezeKey.  
**Example:**
```ts
import { TokenFreezeTransaction } from "@hashgraph/sdk";

await new TokenFreezeTransaction()
  .setTokenId(tokenId)
  .setAccountId(userAccountId)
  .execute(client);
```

### TokenGrantKycTransaction / TokenRevokeKycTransaction  
**Purpose:** allow or revoke a user's ability to hold/transfer KYC-restricted tokens.  
**When used:** onboarding flows that require KYC verification before token interactions.  
**Preconditions:** token must have a kycKey set and transaction signed by kycKey.  
**Example:**
```ts
import { TokenGrantKycTransaction } from "@hashgraph/sdk";

await new TokenGrantKycTransaction()
  .setTokenId(tokenId)
  .setAccountId(userAccountId)
  .execute(client);
```

### TokenWipeTransaction  
**Purpose:** remove tokens from a specific account (e.g., recover lost tokens in custodial flows or enforce compliance).  
**When used:** custodial remediation, forced redemptions when off-chain proof validates removal.  
**Preconditions:** wipeKey set on token and legitimate authorization.  
**Example:**
```ts
import { TokenWipeTransaction } from "@hashgraph/sdk";

await new TokenWipeTransaction()
  .setTokenId(tokenId)
  .setAccountId(userAccountId)
  .setAmount(50)
  .execute(client);
```

### TokenUpdateTransaction / TokenDeleteTransaction  
**Purpose:** update token metadata, modify token keys, or delete a token (delete typically requires adminKey).  
**When used:** governance changes to token parameters, emergency decommission.  
**Preconditions:** signed by adminKey.  
**Example:**
```ts
import { TokenUpdateTransaction } from "@hashgraph/sdk";

await new TokenUpdateTransaction()
  .setTokenId(tokenId)
  .setTokenName("New Name")
  .execute(client);
```

### ScheduleCreateTransaction  
**Purpose:** schedule multi-signature or atomic multi-step operations (e.g., require multiple approvals before minting).  
**When used:** multi-sig governance operations like scheduled minting that require multiple signatures.  
**Preconditions:** builders must provide required signers; scheduledTx must be valid.  
**Example:**
```ts
import { ScheduleCreateTransaction } from "@hashgraph/sdk";

const scheduledTx = new TokenMintTransaction().setTokenId(tokenId).setAmount(1000);
const scheduleTx = await new ScheduleCreateTransaction()
  .setScheduledTransaction(scheduledTx)
  .execute(client);
```

### AccountBalanceQuery  
**Purpose:** query balances for HBAR and HTS tokens for an account.  
**When used:** in UI balance checks, reconciliation and audit.  
**Example:**
```ts
import { AccountBalanceQuery } from "@hashgraph/sdk";

const balance = await new AccountBalanceQuery().setAccountId(userAccountId).execute(client);
console.log(balance.hbars.toString(), balance.tokens);
```

### TransactionReceipt / TransactionRecord retrieval  
**Purpose:** confirm finality, fetch transaction status, timestamp, and record (for example to get the transaction consensus timestamp to include in off-chain proofs).  
**When used:** always after executing a transaction — use receipts for success/failure and records for event details (and timestamps).  
**Example:**
```ts
const txResponse = await tx.execute(client);
const receipt = await txResponse.getReceipt(client);
const record = await txResponse.getRecord(client);
console.log("consensus ts:", record.consensusTimestamp?.toString());
```

### AccountAllowanceApproveTransaction (allowances)  
**Purpose:** allow an operator / smart contract / escrow to spend a holder's tokens/HBAR up to an allowance. Useful for gasless UX or delegated custodial flows.  
**When used:** delegated redemptions or subscription-style flows.  
**Example:**
```ts
import { AccountAllowanceApproveTransaction } from "@hashgraph/sdk";

await new AccountAllowanceApproveTransaction()
  .approveTokenAllowance(tokenId, holderAccountId, spenderAccountId, 100)
  .execute(client);
```

---

## Best-practices & Operational Notes

- **HCS message sizing:** HCS messages have a practical size limit. For large documents or proofs, store off-chain (IPFS/S3/Arweave) and log a SHA256 hash + pointer on HCS.
- **Always check receipts and records:** receipts confirm consensus success; records include timestamps and any returned bytes. Use consensus timestamps when building verifiable off-chain proofs.
- **Authorization & keys:** set adminKey, supplyKey, kycKey, freezeKey and wipeKey carefully during TokenCreate. Keep private keys in secure KMS for production.
- **Association requirement:** accounts must be associated with a token before receiving it — make this explicit in onboarding flows.
- **Atomicity:** TransferTransaction can move HBAR and tokens atomically — use this for settlement legs to avoid partial states.
- **Fee budgeting:** each transaction type has small predictable fees; batch non-urgent logs or compress messages to keep costs minimal.

---

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