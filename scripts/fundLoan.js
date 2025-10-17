const { ethers } = require("hardhat");

module.exports = async (address, loanId, signerIndex = 1) => {
  const lender = (await ethers.getSigners())[signerIndex];
  
  const loanSystem = await ethers.getContractAt("P2PLoanSystem", address, lender);
  
  const loan = await loanSystem.getLoan(loanId);
  const loanAmount = loan.loanAmount;
  
  console.log(`Funding loan ${loanId} with ${ethers.utils.formatEther(loanAmount)} HBAR`);
  
  const tx = await loanSystem.fundLoan(loanId, { value: loanAmount });
  await tx.wait();
  
  console.log(`Loan ${loanId} funded successfully by ${lender.address}`);
  
  return tx;
};