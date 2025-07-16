const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// Get budget for logged-in user
router.get('/', async (req, res) => {
  try {
    const userId = req.auth.sub;
    const budget = await Budget.findOne({ userId });

    if (!budget) {
      return res.status(404).json({ message: 'No budget found.' });
    }

    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create or update budget and recalculate expenses
router.post('/', async (req, res) => {
  try {
     const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: No user ID found in token' });
    }
    const totalBudget = req.body.amount || req.body.totalBudget;

    let budget = await Budget.findOne({ userId });

    if (budget) {
      budget.totalBudget = totalBudget;
    } else {
      budget = new Budget({
        userId,
        totalBudget: totalBudget,
      });
    }

    // Recalculate expenses total
    const expensesTotalAgg = await Expense.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpenses = expensesTotalAgg[0]?.total || 0;

    // Add extra fields to budget (if your schema allows)
    budget.expenses = totalExpenses;
    budget.remaining = totalBudget - totalExpenses;

    await budget.save();

    res.json(budget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create/update budget' });
  }
});

module.exports = router;
