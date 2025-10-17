/*-
 *
 * Hedera P2P Loan System
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 */

const { ethers } = require("hardhat");

module.exports = async () => {
  // Assign the first signer from the configuration
  let wallet = (await ethers.getSigners())[0];

  console.log(`Deploying P2PLoanSystem contract with account: ${wallet.address}`);

  // Initialize contract factory
  const P2PLoanSystem = await ethers.getContractFactory("P2PLoanSystem", wallet);
  
  // Deploy the contract
  const loanSystem = await P2PLoanSystem.deploy();
  
  // Wait for deployment and get contract address
  const contractAddress = (await loanSystem.deployTransaction.wait())
    .contractAddress;

  console.log(`P2PLoanSystem deployed to: ${contractAddress}`);

  return contractAddress;
};