const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Expense = require('../models/Expense'); // <-- Added import of Expense model

// GET: Fetch budget for logged-in user
router.get('/', async (req, res) => {
  try {
    const userId = req.auth.sub;
    const budget = await Budget.findOne({ userId });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.json(budget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch budget' });
  }
});

// POST: Create or update budget for logged-in user
router.post('/', async (req, res) => {
  try {
    const userId = req.auth.sub;
    const { totalBudget } = req.body;

    if (typeof totalBudget !== 'number' || totalBudget < 0) {
      return res.status(400).json({ message: 'Invalid budget value' });
    }

    let budget = await Budget.findOne({ userId });
    if (budget) {
      // Update existing budget
      budget.totalBudget = totalBudget;
    } else {
      // Create new budget
      budget = new Budget({ userId, totalBudget });
    }

    // Recalculate expenses total
    const expensesTotalAgg = await Expense.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpenses = expensesTotalAgg[0]?.total || 0;

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
