const mongoose = require('mongoose');

const repaidLoanSchema = new mongoose.Schema({
  fundedLoanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FundedLoan',
    required: true
  },
  repaidAt: {
    type: Number,
    required: true
  },
  repaymentTxHash: {
    type: String,
    required: true
  },
  daysEarlyLate: {
    type: Number,
    default: 0
  },
  paymentCategory: {
    type: String,
    enum: ['early', 'on_time', 'late'],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RepaidLoan', repaidLoanSchema);