const { ethers } = require("hardhat");

module.exports = async (address, loanId) => {
  const wallet = (await ethers.getSigners())[0];
  
  const loanSystem = await ethers.getContractAt("P2PLoanSystem", address, wallet);
  
  const loan = await loanSystem.getLoan(loanId);
  
  const statusNames = ["Requested", "Funded", "Repaid", "Defaulted"];
  
  console.log("\n=== Loan Details ===");
  console.log(`Loan ID: ${loanId}`);
  console.log(`Borrower: ${loan.borrower}`);
  console.log(`Lender: ${loan.lender}`);
  console.log(`Loan Amount: ${ethers.utils.formatEther(loan.loanAmount)} HBAR`);
  console.log(`Interest: ${ethers.utils.formatEther(loan.interest)} HBAR`);
  console.log(`Total Debt: ${ethers.utils.formatEther(loan.loanAmount.add(loan.interest))} HBAR`);
  console.log(`Deadline: ${new Date(loan.deadline * 1000).toLocaleString()}`);
  console.log(`Status: ${statusNames[loan.status]}`);
  console.log(`Created At: ${new Date(loan.createdAt * 1000).toLocaleString()}`);
  console.log("==================\n");
  
  return loan;
};