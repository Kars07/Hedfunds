const { ethers } = require("hardhat");

module.exports = async (address, loanAmount, interest, deadline) => {
  const wallet = (await ethers.getSigners())[0];
  
  const loanSystem = await ethers.getContractAt("P2PLoanSystem", address, wallet);
  
  const tx = await loanSystem.requestLoan(loanAmount, interest, deadline);
  const receipt = await tx.wait();
  
  const event = receipt.events?.find(e => e.event === "LoanRequested");
  const loanId = event?.args?.loanId;
  
  console.log(`Loan requested with ID: ${loanId}`);
  console.log(`Loan Amount: ${ethers.utils.formatEther(loanAmount)} HBAR`);
  console.log(`Interest: ${ethers.utils.formatEther(interest)} HBAR`);
  
  return loanId;
};