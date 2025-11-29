const mongoose = require("mongoose");

const recurringExpenseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    enum: ["Food", "Utilities", "Rent", "Entertainment", "Other"],
  },
  frequency: {
    type: String,
    required: true,
    enum: ["daily", "weekly", "biweekly", "monthly", "yearly"],
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    default: null, // null means ongoing
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("RecurringExpense", recurringExpenseSchema);
