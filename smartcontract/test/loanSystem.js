/*-
 *
 * Hedera P2P Loan System Tests
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 *
 */

const hre = require("hardhat");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("P2P Loan System", function () {
  let loanSystem;
  let contractAddress;
  let borrower, lender, otherUser;
  let loanAmount, interest, deadline;

  before(async function () {
    // Get signers
    const signers = await ethers.getSigners();
    borrower = signers[0];
    lender = signers[1];
    otherUser = signers[2];
    
    console.log("Borrower:", borrower.address);
    console.log("Lender:", lender.address);
  });

  beforeEach(async function () {
    // Deploy fresh contract for each test
    const P2PLoanSystem = await ethers.getContractFactory("P2PLoanSystem", borrower);
    loanSystem = await P2PLoanSystem.deploy();
    await loanSystem.deployed();
    contractAddress = loanSystem.address;
    
    // Set test values
    loanAmount = ethers.utils.parseEther("5000");
    interest = ethers.utils.parseEther("500");
    deadline = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
  });

  describe("Deployment", function () {
    it("should deploy the contract successfully", async function () {
      expect(contractAddress).to.not.be.null;
      expect(contractAddress).to.not.equal(ethers.constants.AddressZero);
    });

    it("should initialize with loan counter at 0", async function () {
      const counter = await loanSystem.loanCounter();
      expect(counter).to.equal(0);
    });
  });

  describe("Request Loan", function () {
    it("should allow borrower to request a loan", async function () {
      await loanSystem.connect(borrower).requestLoan(
        loanAmount,
        interest,
        deadline
      );
      
      const loan = await loanSystem.getLoan(0);
      expect(loan.borrower).to.equal(borrower.address);
    });

    it("should store loan details correctly", async function () {
      await loanSystem.connect(borrower).requestLoan(loanAmount, interest, deadline);
      
      const loan = await loanSystem.getLoan(0);
      
      expect(loan.borrower).to.equal(borrower.address);
      expect(loan.loanAmount).to.equal(loanAmount);
      expect(loan.interest).to.equal(interest);
      expect(loan.deadline).to.equal(deadline);
      expect(loan.status).to.equal(0); // Requested
    });

    it("should increment loan counter", async function () {
      await loanSystem.connect(borrower).requestLoan(loanAmount, interest, deadline);
      await loanSystem.connect(lender).requestLoan(loanAmount, interest, deadline);
      
      const counter = await loanSystem.loanCounter();
      expect(counter).to.equal(2);
    });

    it("should fail with zero loan amount", async function () {
      await expect(
        loanSystem.connect(borrower).requestLoan(0, interest, deadline)
      ).to.be.revertedWith("InvalidLoanAmount");
    });

    it("should fail with past deadline", async function () {
      const pastDeadline = Math.floor(Date.now() / 1000) - 1000;
      
      await expect(
        loanSystem.connect(borrower).requestLoan(loanAmount, interest, pastDeadline)
      ).to.be.revertedWith("InvalidDeadline");
    });
  });

  describe("Edit Loan Request", function () {
    let loanId;
    
    beforeEach(async function () {
      await loanSystem.connect(borrower).requestLoan(loanAmount, interest, deadline);
      loanId = 0;
    });

    it("should allow borrower to edit loan request", async function () {
      const newLoanAmount = ethers.utils.parseEther("5500");
      const newInterest = ethers.utils.parseEther("550");
      const newDeadline = deadline + 86400; // +1 day
      
      await loanSystem.connect(borrower).editLoanRequest(
        loanId,
        newLoanAmount,
        newInterest,
        newDeadline
      );
      
      const loan = await loanSystem.getLoan(loanId);
      expect(loan.loanAmount).to.equal(newLoanAmount);
      expect(loan.interest).to.equal(newInterest);
      expect(loan.deadline).to.equal(newDeadline);
    });

    it("should fail if not the borrower", async function () {
      const newLoanAmount = ethers.utils.parseEther("5500");
      
      await expect(
        loanSystem.connect(lender).editLoanRequest(loanId, newLoanAmount, interest, deadline)
      ).to.be.revertedWith("UnauthorizedAccess");
    });

    it("should fail if loan is already funded", async function () {
      // Fund the loan first
      await loanSystem.connect(lender).fundLoan(loanId, { value: loanAmount });
      
      const newLoanAmount = ethers.utils.parseEther("5500");
      
      await expect(
        loanSystem.connect(borrower).editLoanRequest(loanId, newLoanAmount, interest, deadline)
      ).to.be.revertedWith("InvalidLoanStatus");
    });
  });

  describe("Fund Loan", function () {
    let loanId;
    
    beforeEach(async function () {
      await loanSystem.connect(borrower).requestLoan(loanAmount, interest, deadline);
      loanId = 0;
    });

    it("should allow lender to fund a loan", async function () {
      const borrowerBalanceBefore = await ethers.provider.getBalance(borrower.address);
      
      await loanSystem.connect(lender).fundLoan(loanId, { value: loanAmount });
      
      const borrowerBalanceAfter = await ethers.provider.getBalance(borrower.address);
      const loan = await loanSystem.getLoan(loanId);
      
      expect(loan.lender).to.equal(lender.address);
      expect(loan.status).to.equal(1); // Funded
      expect(borrowerBalanceAfter.sub(borrowerBalanceBefore)).to.equal(loanAmount);
    });

    it("should fail with self-funding", async function () {
      await expect(
        loanSystem.connect(borrower).fundLoan(loanId, { value: loanAmount })
      ).to.be.revertedWith("SelfFundingNotAllowed");
    });

    it("should fail with incorrect amount", async function () {
      const wrongAmount = ethers.utils.parseEther("4000");
      
      await expect(
        loanSystem.connect(lender).fundLoan(loanId, { value: wrongAmount })
      ).to.be.revertedWith("IncorrectFundingAmount");
    });

    it("should fail if already funded", async function () {
      await loanSystem.connect(lender).fundLoan(loanId, { value: loanAmount });
      
      await expect(
        loanSystem.connect(otherUser).fundLoan(loanId, { value: loanAmount })
      ).to.be.revertedWith("LoanAlreadyFunded");
    });
  });

  describe("Repay Loan", function () {
    let loanId;
    let totalDebt;
    
    beforeEach(async function () {
      // Request loan
      await loanSystem.connect(borrower).requestLoan(loanAmount, interest, deadline);
      loanId = 0;
      
      // Fund loan
      await loanSystem.connect(lender).fundLoan(loanId, { value: loanAmount });
      
      totalDebt = loanAmount.add(interest);
    });

    it("should allow borrower to repay loan", async function () {
      const lenderBalanceBefore = await ethers.provider.getBalance(lender.address);
      
      await loanSystem.connect(borrower).repayLoan(loanId, { value: totalDebt });
      
      const lenderBalanceAfter = await ethers.provider.getBalance(lender.address);
      const loan = await loanSystem.getLoan(loanId);
      
      expect(loan.status).to.equal(2); // Repaid
      expect(lenderBalanceAfter.sub(lenderBalanceBefore)).to.equal(totalDebt);
    });

    it("should fail with incorrect amount", async function () {
      const wrongAmount = ethers.utils.parseEther("4000");
      
      await expect(
        loanSystem.connect(borrower).repayLoan(loanId, { value: wrongAmount })
      ).to.be.revertedWith("IncorrectRepaymentAmount");
    });

    it("should fail if not the borrower", async function () {
      await expect(
        loanSystem.connect(lender).repayLoan(loanId, { value: totalDebt })
      ).to.be.revertedWith("UnauthorizedAccess");
    });
  });

  describe("Helper Functions", function () {
    let loanId;
    
    beforeEach(async function () {
      await loanSystem.connect(borrower).requestLoan(loanAmount, interest, deadline);
      loanId = 0;
    });

    it("should calculate debt correctly", async function () {
      const calculatedDebt = await loanSystem.calculateDebt(loanId);
      const expectedDebt = loanAmount.add(interest);
      
      expect(calculatedDebt).to.equal(expectedDebt);
    });

    it("should check if loan is active", async function () {
      // Before funding - not active
      let isActive = await loanSystem.isLoanActive(loanId);
      expect(isActive).to.equal(false);
      
      // After funding - active
      await loanSystem.connect(lender).fundLoan(loanId, { value: loanAmount });
      isActive = await loanSystem.isLoanActive(loanId);
      expect(isActive).to.equal(true);
    });

    it("should get loan details", async function () {
      const loan = await loanSystem.getLoan(loanId);
      
      expect(loan.borrower).to.equal(borrower.address);
      expect(loan.loanAmount).to.equal(loanAmount);
      expect(loan.interest).to.equal(interest);
      expect(loan.deadline).to.equal(deadline);
      expect(loan.status).to.equal(0); // Requested
    });

    it("should fail to get non-existent loan", async function () {
      await expect(
        loanSystem.getLoan(999)
      ).to.be.revertedWith("LoanNotFound");
    });
  });

  describe("Integration Test - Full Loan Lifecycle", function () {
    it("should complete a full loan lifecycle successfully", async function () {
      // Step 1: Request loan
      await loanSystem.connect(borrower).requestLoan(loanAmount, interest, deadline);
      const loanId = 0;
      
      let loan = await loanSystem.getLoan(loanId);
      expect(loan.status).to.equal(0); // Requested
      
      // Step 2: Fund loan
      await loanSystem.connect(lender).fundLoan(loanId, { value: loanAmount });
      loan = await loanSystem.getLoan(loanId);
      expect(loan.status).to.equal(1); // Funded
      expect(loan.lender).to.equal(lender.address);
      
      // Step 3: Repay loan
      const totalDebt = loanAmount.add(interest);
      await loanSystem.connect(borrower).repayLoan(loanId, { value: totalDebt });
      loan = await loanSystem.getLoan(loanId);
      expect(loan.status).to.equal(2); // Repaid
      
      // Verify loan counter
      const counter = await loanSystem.loanCounter();
      expect(counter).to.equal(1);
    });
  });
});