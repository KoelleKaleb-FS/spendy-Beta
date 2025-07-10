const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

// GET: Fetch all expenses for logged-in user
router.get('/', async (req, res) => {
  try {
    const userId = req.auth.sub; // User ID from JWT
    const expenses = await Expense.find({ userId });
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
});

// POST: Add a new expense for logged-in user
router.post('/', async (req, res) => {
  try {
    const userId = req.auth.sub;
    const { description, amount, category, date } = req.body;

    const expense = new Expense({
      userId,
      description,
      amount: Number(amount),
      category,
      date: new Date(date),
    });

    const savedExpense = await expense.save();

    // Update budget after adding expense
    const budget = await Budget.findOne({ userId });
    if (budget) {
      const newTotalExpenses = (await Expense.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]))[0]?.total || 0;

      budget.expenses = newTotalExpenses;
      budget.remaining = budget.totalBudget - newTotalExpenses;
      await budget.save();
    }

    res.json(savedExpense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add expense' });
  }
});

// PUT: Update an existing expense if owned by logged-in user
router.put('/:id', async (req, res) => {
  try {
    const userId = req.auth.sub;
    const expenseId = req.params.id;
    const { description, amount, category, date } = req.body;

    const expense = await Expense.findOne({ _id: expenseId, userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or unauthorized' });
    }

    expense.description = description;
    expense.amount = Number(amount);
    expense.category = category;
    expense.date = new Date(date);

    const updatedExpense = await expense.save();

    // Update budget after updating expense
    const budget = await Budget.findOne({ userId });
    if (budget) {
      const newTotalExpenses = (await Expense.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]))[0]?.total || 0;

      budget.expenses = newTotalExpenses;
      budget.remaining = budget.totalBudget - newTotalExpenses;
      await budget.save();
    }

    res.json(updatedExpense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update expense' });
  }
});

// DELETE: Remove an expense if owned by logged-in user and update budget
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.auth.sub;
    const expenseId = req.params.id;

    console.log('DELETE endpoint triggered for id:', expenseId);

    // Delete the expense
    const expense = await Expense.findOneAndDelete({ _id: expenseId, userId });
    if (!expense) {
      console.log(`Expense not found for id: ${expenseId} and user: ${userId}`);
      return res.status(404).json({ message: 'Expense not found or unauthorized' });
    }

    console.log(`Deleted expense ${expenseId} for user ${userId}`);

    // Recalculate total expenses for the user AFTER deletion
    const newTotalExpenses = (await Expense.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]))[0]?.total || 0;

    console.log(`Total expenses after deletion: ${newTotalExpenses}`);

    // Find or create a budget for the user
    let budget = await Budget.findOne({ userId });
    if (!budget) {
      console.log('No budget found for user. Creating a new budget.');
      budget = new Budget({
        userId,
        totalBudget: 0, // Default to 0; you can customize this
        expenses: newTotalExpenses,
        remaining: 0 - newTotalExpenses,
      });
    } else {
      // Update the existing budget
      budget.expenses = newTotalExpenses;
      budget.remaining = budget.totalBudget - newTotalExpenses;
    }

    await budget.save();
    console.log(`Budget updated: expenses = ${budget.expenses}, remaining = ${budget.remaining}`);

    res.json({ message: 'Expense deleted and budget updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete expense' });
  }
});


module.exports = router;
