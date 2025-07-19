const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// Get budget for logged-in user
router.get('/', async (req, res) => {
  console.log('GET /api/budget hit, user:', req.user?.sub);

  try {
    const userId = req.user.sub;

    if (!userId) return res.status(401).json({ message: 'Unauthorized: No user ID found in token' });

    const budget = await Budget.findOne({ userId });

    if (!budget) {
      return res.status(404).json({ message: 'No budget found.' });
    }

    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  console.log('POST /api/budget hit, user:', req.user?.sub);

  try {
    const userId = req.user.sub;

    if (!userId) return res.status(401).json({ message: 'Unauthorized: No user ID found in token' });

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
