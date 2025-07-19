const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// GET /api/budget - Fetch budget for logged-in user
router.get('/', async (req, res) => {
  console.log('GET /api/budget hit');

  try {
    if (!req.user || !req.user.sub) {
      console.error('❌ No user info in token');
      return res.status(401).json({ message: 'Unauthorized: No user ID found in token' });
    }

    const userId = req.user.sub;

    const budget = await Budget.findOne({ userId });

    if (!budget) {
      return res.status(404).json({ message: 'No budget found.' });
    }

    res.json(budget);
  } catch (err) {
    console.error('Error fetching budget:', err);
    res.status(500).json({ message: 'Server error fetching budget' });
  }
});

// POST /api/budget - Create or update budget
router.post('/', async (req, res) => {
  console.log('POST /api/budget hit');

  try {
    if (!req.user || !req.user.sub) {
      console.error('❌ No user info in token');
      return res.status(401).json({ message: 'Unauthorized: No user ID found in token' });
    }

    const userId = req.user.sub;

    const amount = req.body.amount;
    if (typeof amount !== 'number' || isNaN(amount)) {
      return res.status(400).json({ message: 'Invalid budget amount' });
    }

    let budget = await Budget.findOne({ userId });

    if (budget) {
      budget.totalBudget = amount;
    } else {
      budget = new Budget({
        userId,
        totalBudget: amount,
      });
    }

    // Recalculate expenses total
    const expensesTotalAgg = await Expense.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpenses = expensesTotalAgg[0]?.total || 0;

    budget.expenses = totalExpenses;
    budget.remaining = amount - totalExpenses;

    await budget.save();

    res.json(budget);
  } catch (err) {
    console.error('Error saving budget:', err);
    res.status(500).json({ message: 'Server error saving budget' });
  }
});

module.exports = router;
