require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomiclabs/hardhat-ethers");
// Import dotenv module to access variables stored in the .env file
require("dotenv").config();


// Deploy P2P Loan Contract
task("deploy-loan-contract", "Deploy the P2PLoanSystem contract")
  .setAction(async () => {
    const deployLoanContract = require("./scripts/deployLoanContract");
    return deployLoanContract();
  });

// Request a new loan
task("request-loan", "Request a new loan")
  .addParam("contractAddress", "The loan contract address")
  .addParam("loanAmount", "Loan amount in wei/tinybars")
  .addParam("interest", "Interest amount in wei/tinybars")
  .addParam("deadline", "Deadline as Unix timestamp")
  .setAction(async (taskArgs) => {
    const requestLoan = require("./scripts/requestLoan");
    return requestLoan(
      taskArgs.contractAddress,
      taskArgs.loanAmount,
      taskArgs.interest,
      taskArgs.deadline
    );
  });

// Edit an existing loan request
task("edit-loan", "Edit an existing loan request")
  .addParam("contractAddress", "The loan contract address")
  .addParam("loanId", "The loan ID to edit")
  .addParam("newLoanAmount", "New loan amount in wei/tinybars")
  .addParam("newInterest", "New interest amount in wei/tinybars")
  .addParam("newDeadline", "New deadline as Unix timestamp")
  .setAction(async (taskArgs) => {
    const editLoanRequest = require("./scripts/editLoanRequest");
    return editLoanRequest(
      taskArgs.contractAddress,
      taskArgs.loanId,
      taskArgs.newLoanAmount,
      taskArgs.newInterest,
      taskArgs.newDeadline
    );
  });

// Fund a loan request
task("fund-loan", "Fund a loan request")
  .addParam("contractAddress", "The loan contract address")
  .addParam("loanId", "The loan ID to fund")
  .setAction(async (taskArgs) => {
    const fundLoan = require("./scripts/fundLoan");
    return fundLoan(taskArgs.contractAddress, taskArgs.loanId);
  });

// Repay a funded loan
task("repay-loan", "Repay a funded loan")
  .addParam("contractAddress", "The loan contract address")
  .addParam("loanId", "The loan ID to repay")
  .setAction(async (taskArgs) => {
    const repayLoan = require("./scripts/repayLoan");
    return repayLoan(taskArgs.contractAddress, taskArgs.loanId);
  });

// Get loan details
task("get-loan", "Get details of a specific loan")
  .addParam("contractAddress", "The loan contract address")
  .addParam("loanId", "The loan ID to query")
  .setAction(async (taskArgs) => {
    const getLoanDetails = require("./scripts/getLoanDetails");
    return getLoanDetails(taskArgs.contractAddress, taskArgs.loanId);
  });

// Mark loan as defaulted
task("mark-defaulted", "Mark a loan as defaulted (lender only, after deadline)")
  .addParam("contractAddress", "The loan contract address")
  .addParam("loanId", "The loan ID to mark as defaulted")
  .setAction(async (taskArgs) => {
    const markAsDefaulted = require("./scripts/markAsDefaulted");
    return markAsDefaulted(taskArgs.contractAddress, taskArgs.loanId);
  });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  mocha: {
    timeout: 3600000,
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 500,
      },
    },
  },
  // This specifies network configurations used when running Hardhat tasks
  defaultNetwork: "testnet",
  networks: {
    testnet: {
      // HashIO testnet endpoint from the TESTNET_ENDPOINT variable in the .env file
      url: process.env.TESTNET_ENDPOINT,
      // Your ECDSA account private key pulled from the .env file
      accounts: [process.env.TESTNET_OPERATOR_PRIVATE_KEY],
    },
  },
};