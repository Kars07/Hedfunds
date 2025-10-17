const { ethers } = require("hardhat");

module.exports = async (address, loanId) => {
  const wallet = (await ethers.getSigners())[0];
  
  const loanSystem = await ethers.getContractAt("P2PLoanSystem", address, wallet);
  
  const loan = await loanSystem.getLoan(loanId);
  const totalDebt = loan.loanAmount.add(loan.interest);
  
  console.log(`Repaying loan ${loanId} with ${ethers.utils.formatEther(totalDebt)} HBAR`);
  
  const tx = await loanSystem.repayLoan(loanId, { value: totalDebt });
  await tx.wait();
  
  console.log(`Loan ${loanId} repaid successfully`);
  
  return tx;
};