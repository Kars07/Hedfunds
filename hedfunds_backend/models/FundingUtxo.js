const mongoose = require('mongoose');

const fundingUtxoSchema = new mongoose.Schema({
  fundedLoanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FundedLoan',
    required: true
  },
  txHash: {
    type: String,
    required: true
  },
  outputIndex: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FundingUtxo', fundingUtxoSchema);