const mongoose = require('mongoose');

const loanRequestSchema = new mongoose.Schema({
  loanId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  borrowerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loanAmount: {
    type: Number,
    required: true
  },
  interest: {
    type: Number,
    required: true
  },
  deadline: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'funded', 'repaid', 'defaulted'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LoanRequest', loanRequestSchema);