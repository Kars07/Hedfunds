const mongoose = require('mongoose');

const creditScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentScore: {
    type: Number,
    default: 500
  },
  totalLoans: {
    type: Number,
    default: 0
  },
  onTimePayments: {
    type: Number,
    default: 0
  },
  earlyPayments: {
    type: Number,
    default: 0
  },
  latePayments: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CreditScore', creditScoreSchema);