const mongoose = require('mongoose');

// Import your models
const CreditScore = require('./models/CreditScore');
const FundedLoan = require('./models/FundedLoan');
const FundingUtxo = require('./models/FundingUtxo');
const LoanRequest = require('./models/LoanRequest');
const RepaidLoan = require('./models/RepaidLoan');
const Wallet = require('./models/Wallet');

// Your SQL data converted to JavaScript objects
const sqlData = {
  users: [
    { id: 1, wallet_address: 'wallet_6741ad70e4', payment_key_hash: '6741ad70e44567a612158287d607f850317af90643d64afe8d10da10', created_at: '2025-05-20 17:51:05' },
    { id: 2, wallet_address: 'wallet_4989200bb9', payment_key_hash: '4989200bb97c981e00b4686595c329cdb6f5d7e125f460411b835f08', created_at: '2025-05-20 17:51:05' },
    { id: 3, wallet_address: 'wallet_d77b032053', payment_key_hash: 'd77b0320530acb416e56dd676845f258860c0a40255bc981a7bda4f2', created_at: '2025-05-20 21:21:31' },
    { id: 4, wallet_address: 'wallet_d9a2a08492', payment_key_hash: 'd9a2a08492881cdfd1a420c5cadb93a6366b331ab6a4c58eb4be3636', created_at: '2025-05-27 04:01:32' }
  ],

  credit_scores: [
    { id: 1, user_id: 1, current_score: 810, total_loans: 2, on_time_payments: 0, late_payments: 0, early_payments: 2 },
    { id: 3, user_id: 2, current_score: 850, total_loans: 4, on_time_payments: 1, late_payments: 0, early_payments: 3 },
    { id: 4, user_id: 3, current_score: 500, total_loans: 0, on_time_payments: 0, late_payments: 0, early_payments: 0 }
  ],

  loan_requests: [
    { id: 1, loan_id: '8b8a22da1c2e76ae00c5f62f6707f066f1035136cd83953c2fb40cd351d35d5e-0', borrower_id: 2, loan_amount: 42391562, interest: 8478312, deadline: '1748340139014', status: 'repaid' },
    { id: 2, loan_id: '01ba976c74d7c352b115ea5e316da9c614c2235f8c75952ee16adfc3127b34a9-0', borrower_id: 2, loan_amount: 59354729, interest: 16958494, deadline: '1748376405775', status: 'funded' },
    { id: 3, loan_id: '0d3b57d6590afd83e8bee63cc935258fa4ff26c5f49c1ccc0e3d06123d970350-0', borrower_id: 1, loan_amount: 84777375, interest: 8477737, deadline: '1748376739751', status: 'repaid' },
    { id: 4, loan_id: 'aeecc1b24ae1c81a6d47ef5bd126217213aaa04eec974648aa444502e13497d7-0', borrower_id: 1, loan_amount: 19314422, interest: 8397575, deadline: '1748380727185', status: 'repaid' },
    { id: 5, loan_id: 'd19eb724d07c3eb4c2f33dfa4317a39d53ac205ce040a046172fbc9d0be680b3-0', borrower_id: 1, loan_amount: 62613487, interest: 3388955, deadline: '1748534221163', status: 'repaid' },
    { id: 6, loan_id: 'ae8396549b5e592631be1b85ef9790d1ba7f8d82c36674e714117b87cc07c4d3-0', borrower_id: 2, loan_amount: 73517606, interest: 8450300, deadline: '1748379233812', status: 'repaid' },
    { id: 7, loan_id: '12d5df538f63ad6ad5b82048414a9f9aa17a697ce9fd5be2fafc45bd438960a5-0', borrower_id: 3, loan_amount: 107459279, interest: 38709331, deadline: '1748703857011', status: 'funded' },
    { id: 8, loan_id: '8692e738e1a473d7688fc0bb7a8775c4529ebfcca814c9314bd98c3c669c9173-0', borrower_id: 2, loan_amount: 78000000, interest: 6770000, deadline: '1751032089493', status: 'repaid' },
    { id: 9, loan_id: '463f0bbdf724dea861e8032e264ab93c49d03aa0f8e9c15374eb356be1f6aea1-0', borrower_id: 2, loan_amount: 192006593, interest: 8240626, deadline: '1748859437819', status: 'repaid' },
    { id: 10, loan_id: 'ff6394c36a341e76903b28ff6bdecbccd5983beea0370574c9d97c6806cc6d13-0', borrower_id: 2, loan_amount: 230240437, interest: 32891491, deadline: '1748868149467', status: 'repaid' },
    { id: 11, loan_id: '3074f4df9be59b3290bfb58c174435fcbfc292ea8a063e883862182107c7db5b-0', borrower_id: 4, loan_amount: 164752788, interest: 19769511, deadline: '1748866798876', status: 'funded' },
    { id: 12, loan_id: '799c1bd4625948d34e134ef4e5671ab4ade21e9d3d60e74a381c196c14bf1d47-0', borrower_id: 1, loan_amount: 74578714, interest: 8379631, deadline: '1748923674826', status: 'repaid' },
    { id: 13, loan_id: '05a0291204771201d3608752171925914eb2decfb939f86acc2ae50c8956dd9d-0', borrower_id: 1, loan_amount: 61616319, interest: 4107755, deadline: '1750943067880', status: 'repaid' },
    { id: 14, loan_id: '8a803b8eb945ac379f9937d7d2b67110abcdad4fe96478b57fe62cc69c1a059e-0', borrower_id: 2, loan_amount: 55939999, interest: 88378838, deadline: '1749456755860', status: 'repaid' }
  ],

  funded_loans: [
    { id: 1, loan_request_id: 1, funded_loan_id: 'b0710b91d4a95c9a248ab72429385e401b343c92761c7b68fc8a23db6bcd80b3-1', lender_id: 1, funded_at: 1747763465644, tx_hash: 'b0710b91d4a95c9a248ab72429385e401b343c92761c7b68fc8a23db6bcd80b3', is_active: false },
    { id: 2, loan_request_id: 2, funded_loan_id: '8e39b23ca41e266ceb3d170251f030bbf3561efd07d8df57b622e0d4ee2a499c-0', lender_id: 1, funded_at: 1747771760085, tx_hash: '8e39b23ca41e266ceb3d170251f030bbf3561efd07d8df57b622e0d4ee2a499c', is_active: false },
    { id: 3, loan_request_id: 3, funded_loan_id: '7e798e94c775bbd4b9d3c831ee4a5a71693f1c752020879e5eca7e3f455c3c4f-1', lender_id: 2, funded_at: 1747772082354, tx_hash: '7e798e94c775bbd4b9d3c831ee4a5a71693f1c752020879e5eca7e3f455c3c4f', is_active: false },
    { id: 4, loan_request_id: 4, funded_loan_id: '840ba4eda5aa2413164fd746d6db75d6f3d84e159c7c7f618041a9714a087116-1', lender_id: 3, funded_at: 1747776092118, tx_hash: '840ba4eda5aa2413164fd746d6db75d6f3d84e159c7c7f618041a9714a087116', is_active: false },
    { id: 5, loan_request_id: 5, funded_loan_id: 'bc098d0f35f149274318a288ec911c539a1ca65266a24524ce0cd2d5945852ac-1', lender_id: 2, funded_at: 1747929544318, tx_hash: 'bc098d0f35f149274318a288ec911c539a1ca65266a24524ce0cd2d5945852ac', is_active: false },
    { id: 6, loan_request_id: 6, funded_loan_id: 'd410535bf4d57ebe49f39c79589355c1e549d46a11c4e6d59a0692c541a79ac8-1', lender_id: 3, funded_at: 1747930264575, tx_hash: 'd410535bf4d57ebe49f39c79589355c1e549d46a11c4e6d59a0692c541a79ac8', is_active: false },
    { id: 7, loan_request_id: 7, funded_loan_id: 'c0d65cf0bcd8fa3319fa4c2d5087d55ba30f387cf0f6fd8c8f5e3b056e2f1968-1', lender_id: 2, funded_at: 1748101810590, tx_hash: 'c0d65cf0bcd8fa3319fa4c2d5087d55ba30f387cf0f6fd8c8f5e3b056e2f1968', is_active: true },
    { id: 8, loan_request_id: 8, funded_loan_id: '55e4ee652d6786f66f59aa522fa55ff3e6254c717308983032601c4ab2f72cde-1', lender_id: 3, funded_at: 1748166042268, tx_hash: '55e4ee652d6786f66f59aa522fa55ff3e6254c717308983032601c4ab2f72cde', is_active: false },
    { id: 9, loan_request_id: 8, funded_loan_id: '795ea145ca7bcc0af1886e96594b40351dfc95c38087588b89d4122d112b36f7-0', lender_id: 3, funded_at: 1748166105208, tx_hash: '795ea145ca7bcc0af1886e96594b40351dfc95c38087588b89d4122d112b36f7', is_active: false },
    { id: 10, loan_request_id: 9, funded_loan_id: 'a961d4b3be8b10d9e071599e054203b264654e64b5608d7334a9d333f2f7cd36-1', lender_id: 3, funded_at: 1748254761375, tx_hash: 'a961d4b3be8b10d9e071599e054203b264654e64b5608d7334a9d333f2f7cd36', is_active: false },
    { id: 11, loan_request_id: 10, funded_loan_id: '62702c04a9617246a3d3abe5e4dca21fb0ac5dab610d3e3a75a018c658c2997a-1', lender_id: 1, funded_at: 1748263530219, tx_hash: '62702c04a9617246a3d3abe5e4dca21fb0ac5dab610d3e3a75a018c658c2997a', is_active: false },
    { id: 12, loan_request_id: 11, funded_loan_id: '4be90c64466614926435b201c4edb24c8e51fbb82280b4625a5b846b7290eea3-0', lender_id: 2, funded_at: 1748318492782, tx_hash: '4be90c64466614926435b201c4edb24c8e51fbb82280b4625a5b846b7290eea3', is_active: false },
    { id: 13, loan_request_id: 12, funded_loan_id: '5ce630fb7455b28763645f2a70dbe5ff48bf301d8e6059bbb8520a38831740f5-1', lender_id: 3, funded_at: 1748319175267, tx_hash: '5ce630fb7455b28763645f2a70dbe5ff48bf301d8e6059bbb8520a38831740f5', is_active: false },
    { id: 14, loan_request_id: 13, funded_loan_id: '9a7cbc7e8eaab91a5dc08d9850e991780766aee278e8683734ccbc91d699193a-1', lender_id: 2, funded_at: 1748351628436, tx_hash: '9a7cbc7e8eaab91a5dc08d9850e991780766aee278e8683734ccbc91d699193a', is_active: false },
    { id: 15, loan_request_id: 14, funded_loan_id: '615b31a59732f174dbb8d3b57afeed2e358fd3c42da13f3ea8e1c58f28dc2dd6-1', lender_id: 3, funded_at: 1748356956162, tx_hash: '615b31a59732f174dbb8d3b57afeed2e358fd3c42da13f3ea8e1c58f28dc2dd6', is_active: false }
  ],

  funding_utxos: [
    { id: 1, funded_loan_id: 1, tx_hash: 'b0710b91d4a95c9a248ab72429385e401b343c92761c7b68fc8a23db6bcd80b3', output_index: 1 },
    { id: 2, funded_loan_id: 2, tx_hash: '8e39b23ca41e266ceb3d170251f030bbf3561efd07d8df57b622e0d4ee2a499c', output_index: 0 },
    { id: 3, funded_loan_id: 3, tx_hash: '7e798e94c775bbd4b9d3c831ee4a5a71693f1c752020879e5eca7e3f455c3c4f', output_index: 1 },
    { id: 4, funded_loan_id: 4, tx_hash: '840ba4eda5aa2413164fd746d6db75d6f3d84e159c7c7f618041a9714a087116', output_index: 1 },
    { id: 5, funded_loan_id: 5, tx_hash: 'bc098d0f35f149274318a288ec911c539a1ca65266a24524ce0cd2d5945852ac', output_index: 1 },
    { id: 6, funded_loan_id: 6, tx_hash: 'd410535bf4d57ebe49f39c79589355c1e549d46a11c4e6d59a0692c541a79ac8', output_index: 1 },
    { id: 7, funded_loan_id: 7, tx_hash: 'c0d65cf0bcd8fa3319fa4c2d5087d55ba30f387cf0f6fd8c8f5e3b056e2f1968', output_index: 1 },
    { id: 8, funded_loan_id: 8, tx_hash: '55e4ee652d6786f66f59aa522fa55ff3e6254c717308983032601c4ab2f72cde', output_index: 1 },
    { id: 9, funded_loan_id: 9, tx_hash: '795ea145ca7bcc0af1886e96594b40351dfc95c38087588b89d4122d112b36f7', output_index: 0 },
    { id: 10, funded_loan_id: 10, tx_hash: 'a961d4b3be8b10d9e071599e054203b264654e64b5608d7334a9d333f2f7cd36', output_index: 1 },
    { id: 11, funded_loan_id: 11, tx_hash: '62702c04a9617246a3d3abe5e4dca21fb0ac5dab610d3e3a75a018c658c2997a', output_index: 1 },
    { id: 12, funded_loan_id: 12, tx_hash: '4be90c64466614926435b201c4edb24c8e51fbb82280b4625a5b846b7290eea3', output_index: 0 },
    { id: 13, funded_loan_id: 13, tx_hash: '5ce630fb7455b28763645f2a70dbe5ff48bf301d8e6059bbb8520a38831740f5', output_index: 1 },
    { id: 14, funded_loan_id: 14, tx_hash: '9a7cbc7e8eaab91a5dc08d9850e991780766aee278e8683734ccbc91d699193a', output_index: 1 },
    { id: 15, funded_loan_id: 15, tx_hash: '615b31a59732f174dbb8d3b57afeed2e358fd3c42da13f3ea8e1c58f28dc2dd6', output_index: 1 }
  ],

  repaid_loans: [
    { id: 1, funded_loan_id: 1, repaid_at: 1747771839627, repayment_tx_hash: '45bc9a0dca241e82c680822f2a9e359280a1596ee443cd1dc068f9dc5a7c9fcf', days_early_late: 0, payment_category: 'on_time' },
    { id: 2, funded_loan_id: 3, repaid_at: 1747772193129, repayment_tx_hash: '4983b353353e6d48c097174441dfd2d6dbdcd7be5e07bec43d76a6ae98ed1efc', days_early_late: 0, payment_category: 'on_time' },
    { id: 3, funded_loan_id: 4, repaid_at: 1747776289678, repayment_tx_hash: '911486ff339076e0ea5f5d3ec200aa7d6a3235d654d281fbf49dcd480dfe5f0b', days_early_late: 0, payment_category: 'on_time' },
    { id: 4, funded_loan_id: 5, repaid_at: 1747929674888, repayment_tx_hash: 'cde1ba211d7890a1264b5723f78b1feeb4052a1b4c3d8fabc17fbaab65b87dbe', days_early_late: 0, payment_category: 'on_time' },
    { id: 27, funded_loan_id: 11, repaid_at: 1748263646539, repayment_tx_hash: 'ccb6efd05af079d4650428d6c2ece0ee47e8823f688698f54b0e2e150f0b439c', days_early_late: 0, payment_category: 'on_time' },
    { id: 31, funded_loan_id: 13, repaid_at: 1748323939952, repayment_tx_hash: '46cc3affbb8a92e7c0b8ead4a2fbe4f88d1ad1174f8e9de6e7815f42807b5e81', days_early_late: 6, payment_category: 'early' },
    { id: 32, funded_loan_id: 6, repaid_at: 1748329188728, repayment_tx_hash: '34a8ba0fed90525063f2451a8b926ef1111d98ffa8b65ea2ca3585e6e13702dd', days_early_late: 0, payment_category: 'on_time' },
    { id: 33, funded_loan_id: 8, repaid_at: 1748329375951, repayment_tx_hash: '98ec0a579072ea5e896a91eb5bdf736f00f9be492d4570d57f360813a7f655d5', days_early_late: 31, payment_category: 'early' },
    { id: 34, funded_loan_id: 10, repaid_at: 1748344920354, repayment_tx_hash: 'd97dfb546289384d14b34239339c27faa55a977444a9ea583fd40a67570da5e0', days_early_late: 5, payment_category: 'early' },
    { id: 35, funded_loan_id: 14, repaid_at: 1748352904247, repayment_tx_hash: '3caa51762a2fefab190b15045ff860a384ff8e66f8c52fbdd374e361e8eaec24', days_early_late: 29, payment_category: 'early' },
    { id: 36, funded_loan_id: 15, repaid_at: 1748357066466, repayment_tx_hash: '34e923835c74ccf23a3a3a9a55025f27a88f2183de6a25308df3d04382d5a9a1', days_early_late: 12, payment_category: 'early' }
  ]
};

async function migrateData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://officialswiftfund:NextGenAlpha@swiftfunddb.w9ryzds.mongodb.net/SwiftfundDB');
    console.log('Connected to MongoDB');

    // Clear existing collections (optional - remove if you want to keep existing data)
    console.log('Clearing existing collections...');
    await Promise.all([
      Wallet.deleteMany({}),
      CreditScore.deleteMany({}),
      LoanRequest.deleteMany({}),
      FundedLoan.deleteMany({}),
      FundingUtxo.deleteMany({}),
      RepaidLoan.deleteMany({})
    ]);

    // Maps to store SQL ID to MongoDB ObjectId mappings
    const userIdMap = new Map();
    const loanRequestIdMap = new Map();
    const fundedLoanIdMap = new Map();

    // 1. Migrate Users (create Wallets in MongoDB)
    console.log('Migrating users to wallets...');
    for (const user of sqlData.users) {
      const wallet = new Wallet({
        walletAddress: user.wallet_address,
        paymentKeyHash: user.payment_key_hash
      });
      const savedWallet = await wallet.save();
      userIdMap.set(user.id, savedWallet._id);
      console.log(`Migrated user ${user.id} -> ${savedWallet._id}`);
    }

    // 2. Migrate Credit Scores
    console.log('Migrating credit scores...');
    for (const score of sqlData.credit_scores) {
      const creditScore = new CreditScore({
        userId: userIdMap.get(score.user_id),
        currentScore: score.current_score,
        totalLoans: score.total_loans,
        onTimePayments: score.on_time_payments,
        earlyPayments: score.early_payments,
        latePayments: score.late_payments
      });
      await creditScore.save();
      console.log(`Migrated credit score for user ${score.user_id}`);
    }

    // 3. Migrate Loan Requests
    console.log('Migrating loan requests...');
    for (const loan of sqlData.loan_requests) {
      const loanRequest = new LoanRequest({
        loanId: loan.loan_id,
        borrowerId: userIdMap.get(loan.borrower_id),
        loanAmount: loan.loan_amount,
        interest: loan.interest,
        deadline: loan.deadline,
        status: loan.status
      });
      const savedLoan = await loanRequest.save();
      loanRequestIdMap.set(loan.id, savedLoan._id);
      console.log(`Migrated loan request ${loan.id} -> ${savedLoan._id}`);
    }

    // 4. Migrate Funded Loans
    console.log('Migrating funded loans...');
    for (const fundedLoan of sqlData.funded_loans) {
      const funded = new FundedLoan({
        loanRequestId: loanRequestIdMap.get(fundedLoan.loan_request_id),
        fundedLoanId: fundedLoan.funded_loan_id,
        lenderId: userIdMap.get(fundedLoan.lender_id),
        fundedAt: fundedLoan.funded_at,
        txHash: fundedLoan.tx_hash,
        isActive: fundedLoan.is_active
      });
      const savedFunded = await funded.save();
      fundedLoanIdMap.set(fundedLoan.id, savedFunded._id);
      console.log(`Migrated funded loan ${fundedLoan.id} -> ${savedFunded._id}`);
    }

    // 5. Migrate Funding UTXOs
    console.log('Migrating funding UTXOs...');
    for (const utxo of sqlData.funding_utxos) {
      const fundingUtxo = new FundingUtxo({
        fundedLoanId: fundedLoanIdMap.get(utxo.funded_loan_id),
        txHash: utxo.tx_hash,
        outputIndex: utxo.output_index
      });
      await fundingUtxo.save();
      console.log(`Migrated funding UTXO ${utxo.id}`);
    }

    // 6. Migrate Repaid Loans
    console.log('Migrating repaid loans...');
    for (const repaid of sqlData.repaid_loans) {
      const repaidLoan = new RepaidLoan({
        fundedLoanId: fundedLoanIdMap.get(repaid.funded_loan_id),
        repaidAt: repaid.repaid_at,
        repaymentTxHash: repaid.repayment_tx_hash,
        daysEarlyLate: repaid.days_early_late,
        paymentCategory: repaid.payment_category
      });
      await repaidLoan.save();
      console.log(`Migrated repaid loan ${repaid.id}`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('Summary:');
    console.log(`- Users migrated: ${sqlData.users.length}`);
    console.log(`- Credit scores migrated: ${sqlData.credit_scores.length}`);
    console.log(`- Loan requests migrated: ${sqlData.loan_requests.length}`);
    console.log(`- Funded loans migrated: ${sqlData.funded_loans.length}`);
    console.log(`- Funding UTXOs migrated: ${sqlData.funding_utxos.length}`);
    console.log(`- Repaid loans migrated: ${sqlData.repaid_loans.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateData();