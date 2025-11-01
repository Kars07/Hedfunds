# HedFunds: Decentralized Peer-to-Peer Lending Platform

HedFunds is a decentralized platform built on the Hedera that connects borrowers and lenders directly. By leveraging Hedera technology, HedFunds ensures transparency, security, and trust in financial transactions. The platform includes a **frontend**, **backend**, and **smart contracts** that work seamlessly together to provide a robust and user-friendly experience. This platform isn't just meant for web3 enthusiast, it's targetting the whole of Africa and is going to revolutionize lending on a large scale

---

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
   - Utilizes Hedera’s HTS (Hedera Token Service) for efficient, low-cost transfers.

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


2. Setup Backend
    ```bash
    cd hedfunds_backend
    npm install
    cp .env.example .env


3. Configure environment variables in .env and then run the server.js file 
    ```bash
    node server.js 


4. The backend would be running on port 5000
   ```bash
   Server running on port 5000
   Connected to Mongo Atlas!


6. Setup Frontend
   ```bash
    cd  hedfunds_frontend
    npm install
    npm run dev

8. Deploy smart Contracts
   ```bash
   npm install
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network testnet

---

### frontend port for testing: http://localhost:5173

### Backend port for testing :  http://localhost:5000/

---

### Technologies Used
Frontend: React, Vite, TypeScript, TailwindCSS


Backend: Node.js, Express, MongoDB


Smart Contracts: Solidity, Hardhat, Hedera SDK


Blockchain: Hedera Hashgraph

Email Service: Nodemailer

Deployment:  Hedera Testnet

---

### WHY Hedera?
Fast finality (<5 seconds)

Low fees (fractions of a cent)

EVM-compatible smart contracts

Carbon-negative network

Enterprise-grade security and scalability

---

### License


This project is licensed under the MIT License. ```
