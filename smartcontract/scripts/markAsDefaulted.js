const { ethers } = require("hardhat");

module.exports = async (address, loanId, signerIndex = 1) => {
  const lender = (await ethers.getSigners())[signerIndex];
  
  const loanSystem = await ethers.getContractAt("P2PLoanSystem", address, lender);
  
  const tx = await loanSystem.markAsDefaulted(loanId);
  await tx.wait();
  
  console.log(`Loan ${loanId} marked as defaulted by ${lender.address}`);
  
  return tx;
};