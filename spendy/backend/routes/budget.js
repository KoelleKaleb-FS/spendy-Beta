const express = require("express");
const router = express.Router();
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const RecurringExpense = require("../models/RecurringExpense");
const { calculateForecast, getDaysIntoMonth } = require("../utils/forecast");

// --------------------
// GET /api/budget - Fetch budget for logged-in user
// --------------------
router.get("/", async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user ID found in token" });
    }

    const userId = req.user.sub;
    const budget = await Budget.findOne({ userId });

    if (!budget) return res.status(404).json({ message: "No budget found." });

    res.json(budget);
  } catch (err) {
    console.error("Error fetching budget:", err);
    res.status(500).json({ message: "Server error fetching budget" });
  }
});

// --------------------
// POST /api/budget - Create or update budget
// --------------------
router.post("/", async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user ID found in token" });
    }

    const userId = req.user.sub;
    const amount = req.body.amount;

    if (typeof amount !== "number" || isNaN(amount)) {
      return res.status(400).json({ message: "Invalid budget amount" });
    }

    let budget = await Budget.findOne({ userId });

    if (budget) {
      budget.totalBudget = amount;
    } else {
      budget = new Budget({ userId, totalBudget: amount });
    }

    // Recalculate expenses total
    const expensesTotalAgg = await Expense.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalExpenses = expensesTotalAgg[0]?.total || 0;

    budget.expenses = totalExpenses;
    budget.remaining = amount - totalExpenses;

    await budget.save();
    res.json(budget);
  } catch (err) {
    console.error("Error saving budget:", err);
    res.status(500).json({ message: "Server error saving budget" });
  }
});

// --------------------
// GET /api/budget/forecast - Overall forecast including recurring expenses
// --------------------
router.get("/forecast", async (req, res) => {
  try {
    if (!req.user || !req.user.sub)
      return res
        .status(401)
        .json({ message: "Unauthorized: No user info in token" });

    const userId = req.user.sub;
    const budget = await Budget.findOne({ userId });

    if (!budget) return res.status(404).json({ message: "No budget found" });

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Fetch regular expenses for current month
    const monthExpenses = await Expense.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const totalMonthExpenses = monthExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    // Fetch active recurring expenses
    const recurringExpenses = await RecurringExpense.find({
      userId,
      isActive: true,
    });

    // Calculate upcoming recurring expenses for the month
    let totalRecurringThisMonth = 0;
    const totalDaysInMonth = endOfMonth.getDate();

    recurringExpenses.forEach((exp) => {
      let monthlyAmount = 0;

      switch (exp.frequency) {
        case "daily":
          monthlyAmount = exp.amount * totalDaysInMonth;
          break;
        case "weekly":
          monthlyAmount = exp.amount * 4.33;
          break;
        case "biweekly":
          monthlyAmount = exp.amount * 2.17;
          break;
        case "monthly":
          monthlyAmount = exp.amount;
          break;
        case "yearly":
          monthlyAmount = exp.amount / 12;
          break;
        default:
          monthlyAmount = 0;
      }

      totalRecurringThisMonth += monthlyAmount;
    });

    const daysIntoMonth = getDaysIntoMonth();
    const combinedSpend = totalMonthExpenses + totalRecurringThisMonth;

    const forecast = calculateForecast(
      combinedSpend,
      budget.totalBudget,
      daysIntoMonth
    );

    forecast.totalRecurring = Math.round(totalRecurringThisMonth * 100) / 100;

    res.json(forecast);
  } catch (err) {
    console.error("Error calculating forecast:", err);
    res.status(500).json({ message: "Server error calculating forecast" });
  }
});

// --------------------
// GET /api/budget/forecast/by-category - Category forecasts including recurring expenses
// --------------------
router.get("/forecast/by-category", async (req, res) => {
  try {
    if (!req.user || !req.user.sub)
      return res
        .status(401)
        .json({ message: "Unauthorized: No user info in token" });

    const userId = req.user.sub;
    const budget = await Budget.findOne({ userId });

    if (!budget) return res.status(404).json({ message: "No budget found" });

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Regular expenses aggregated by category
    const monthExpenses = await Expense.aggregate([
      { $match: { userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]);

    // Active recurring expenses
    const recurringExpenses = await RecurringExpense.find({
      userId,
      isActive: true,
    });

    // Convert recurring expenses to monthly amounts by category
    const recurringByCategory = {};
    recurringExpenses.forEach((exp) => {
      let monthlyAmount = 0;
      switch (exp.frequency) {
        case "daily":
          monthlyAmount = exp.amount * 30;
          break;
        case "weekly":
          monthlyAmount = exp.amount * 4.33;
          break;
        case "biweekly":
          monthlyAmount = exp.amount * 2.17;
          break;
        case "monthly":
          monthlyAmount = exp.amount;
          break;
        case "yearly":
          monthlyAmount = exp.amount / 12;
          break;
        default:
          monthlyAmount = 0;
      }
      recurringByCategory[exp.category] =
        (recurringByCategory[exp.category] || 0) + monthlyAmount;
    });

    const daysIntoMonth = getDaysIntoMonth();
    const categoryForecasts = {};

    // Merge regular + recurring expenses, separate recurring & variable
    const allCategories = new Set([
      ...monthExpenses.map((e) => e._id),
      ...Object.keys(recurringByCategory),
    ]);

    allCategories.forEach((category) => {
      const recurring = recurringByCategory[category] || 0;
      const spent = monthExpenses.find((e) => e._id === category)?.total || 0;
      const variable = Math.max(spent - recurring, 0); // variable spend = actual - recurring

      const categoryGoal = budget.categoryGoals?.[category] || 0;
      const projectedTotal = variable + recurring;
      const forecastData = calculateForecast(
        projectedTotal,
        categoryGoal,
        daysIntoMonth
      );

      categoryForecasts[category] = {
        recurring: Math.round(recurring * 100) / 100,
        variable: Math.round(variable * 100) / 100,
        projectedSpend: Math.round(projectedTotal * 100) / 100,
        budget: categoryGoal,
        willOverspend: forecastData.willOverspend,
        overspendAmount: forecastData.overspendAmount,
      };
    });

    res.json(categoryForecasts);
  } catch (err) {
    console.error("Error calculating category forecasts:", err);
    res
      .status(500)
      .json({ message: "Server error calculating category forecasts" });
  }
});

module.exports = router;
