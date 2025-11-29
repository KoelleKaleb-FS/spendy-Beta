const express = require("express");
const router = express.Router();
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const { calculateForecast, getDaysIntoMonth } = require("../utils/forecast");

// GET /api/budget - Fetch budget for logged-in user
router.get('/', async (req, res) => {
  // GET /api/budget hit

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
  // POST /api/budget hit

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

// =============================
// GET /api/budget/forecast - Get budget forecast for current month
// =============================
router.get("/forecast", async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ message: "Unauthorized: No user info in token" });
    }

    const userId = req.user.sub;
    const budget = await Budget.findOne({ userId });

    if (!budget) {
      return res.status(404).json({ message: "No budget found" });
    }

    // Get current month's expenses
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthExpenses = await Expense.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const totalMonthExpenses = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const daysIntoMonth = getDaysIntoMonth();

    const forecast = calculateForecast(totalMonthExpenses, budget.totalBudget, daysIntoMonth);

    res.json(forecast);
  } catch (err) {
    console.error("Error calculating forecast:", err);
    res.status(500).json({ message: "Server error calculating forecast" });
  }
});

// =============================
// GET /api/budget/forecast/by-category - Get forecast by category
// =============================
router.get("/forecast/by-category", async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ message: "Unauthorized: No user info in token" });
    }

    const userId = req.user.sub;
    const budget = await Budget.findOne({ userId });

    if (!budget) {
      return res.status(404).json({ message: "No budget found" });
    }

    // Get current month's expenses by category
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthExpenses = await Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
    ]);

    const categoryForecasts = {};
    const daysIntoMonth = getDaysIntoMonth();

    monthExpenses.forEach((exp) => {
      const category = exp._id;
      const categoryGoal = budget.categoryGoals?.[category] || 0;
      categoryForecasts[category] = calculateForecast(exp.total, categoryGoal, daysIntoMonth);
    });

    res.json(categoryForecasts);
  } catch (err) {
    console.error("Error calculating category forecasts:", err);
    res.status(500).json({ message: "Server error calculating category forecasts" });
  }
});

module.exports = router;
