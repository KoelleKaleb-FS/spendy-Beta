const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  totalBudget: { type: Number, required: true, min: [0, 'Budget must be positive'] },
  expenses: { type: Number, default: 0, min: [0, 'Expenses must be positive'] },
  remaining: { type: Number, default: 0},
}, { timestamps: true });

module.exports = mongoose.model('Budget', BudgetSchema);
