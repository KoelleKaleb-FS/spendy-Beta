const express = require("express");
const router = express.Router();
const RecurringExpense = require("../models/RecurringExpense");

// GET: Fetch all recurring expenses for logged-in user
router.get("/", async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ message: "Unauthorized: No user info in token" });
    }

    const userId = req.user.sub;
    const recurringExpenses = await RecurringExpense.find({ userId });
    res.json(recurringExpenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch recurring expenses" });
  }
});

// POST: Add a new recurring expense
router.post("/", async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ message: "Unauthorized: No user info in token" });
    }

    const userId = req.user.sub;
    const { description, amount, category, frequency, startDate, endDate } = req.body;

    // Validate required fields
    if (!description || !amount || !category || !frequency || !startDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const recurringExpense = new RecurringExpense({
      userId,
      description,
      amount: Number(amount),
      category,
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    });

    const saved = await recurringExpense.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add recurring expense" });
  }
});

// PUT: Update a recurring expense
router.put("/:id", async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ message: "Unauthorized: No user info in token" });
    }

    const userId = req.user.sub;
    const { id } = req.params;
    const { description, amount, category, frequency, startDate, endDate, isActive } = req.body;

    const recurringExpense = await RecurringExpense.findOne({ _id: id, userId });
    if (!recurringExpense) {
      return res.status(404).json({ message: "Recurring expense not found" });
    }

    if (description) recurringExpense.description = description;
    if (amount) recurringExpense.amount = Number(amount);
    if (category) recurringExpense.category = category;
    if (frequency) recurringExpense.frequency = frequency;
    if (startDate) recurringExpense.startDate = new Date(startDate);
    if (endDate) recurringExpense.endDate = new Date(endDate);
    if (isActive !== undefined) recurringExpense.isActive = isActive;
    recurringExpense.updatedAt = new Date();

    const updated = await recurringExpense.save();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update recurring expense" });
  }
});

// DELETE: Remove a recurring expense
router.delete("/:id", async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ message: "Unauthorized: No user info in token" });
    }

    const userId = req.user.sub;
    const { id } = req.params;

    const deleted = await RecurringExpense.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({ message: "Recurring expense not found" });
    }

    res.json({ message: "Recurring expense deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete recurring expense" });
  }
});

// GET: Calculate monthly impact of recurring expenses
router.get("/monthly-impact", async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ message: "Unauthorized: No user info in token" });
    }

    const userId = req.user.sub;
    const recurringExpenses = await RecurringExpense.find({
      userId,
      isActive: true,
    });

    // Calculate monthly amounts based on frequency
    let monthlyImpact = 0;
    
    recurringExpenses.forEach((expense) => {
      let monthlyAmount = 0;
      
      switch (expense.frequency) {
        case "daily":
          monthlyAmount = expense.amount * 30; // Approximate
          break;
        case "weekly":
          monthlyAmount = expense.amount * 4.33; // Approximate
          break;
        case "biweekly":
          monthlyAmount = expense.amount * 2.17; // Approximate
          break;
        case "monthly":
          monthlyAmount = expense.amount;
          break;
        case "yearly":
          monthlyAmount = expense.amount / 12;
          break;
        default:
          monthlyAmount = 0;
      }

      monthlyImpact += monthlyAmount;
    });

    res.json({
      monthlyImpact: Math.round(monthlyImpact * 100) / 100,
      recurringExpenses,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to calculate monthly impact" });
  }
});

module.exports = router;
