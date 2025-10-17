const mongoose = require('mongoose');

const fundedLoanSchema = new mongoose.Schema({
  loanRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanRequest',
    required: true
  },
  fundedLoanId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  lenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fundedAt: {
    type: Number,
    required: true
  },
  txHash: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FundedLoan', fundedLoanSchema);