const { ethers } = require("hardhat");

module.exports = async (address, loanId, newLoanAmount, newInterest, newDeadline) => {
  const wallet = (await ethers.getSigners())[0];
  
  const loanSystem = await ethers.getContractAt("P2PLoanSystem", address, wallet);
  
  const tx = await loanSystem.editLoanRequest(loanId, newLoanAmount, newInterest, newDeadline);
  await tx.wait();
  
  console.log(`Loan ${loanId} edited successfully`);
  console.log(`New Loan Amount: ${ethers.utils.formatEther(newLoanAmount)} HBAR`);
  console.log(`New Interest: ${ethers.utils.formatEther(newInterest)} HBAR`);
  
  return tx;
};