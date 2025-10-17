const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true
  },
  paymentKeyHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Wallet', WalletSchema);