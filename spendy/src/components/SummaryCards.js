import React from 'react';
import styles from '../styles/SummaryCards.module.css';

function SummaryCards({ expenses = [], budgetData }) {
  if (!budgetData) {
    return <p>No budget data available.</p>;
  }

  // Total spent (sum of all expenses)
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Remaining budget from budgetData (assuming it's passed correctly)
  const remaining = budgetData.remaining;

  // Find highest expense category
  const categoryTotals = {};
  expenses.forEach(({ category, amount }) => {
    if (!category) return;
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
  });

  let highestCategory = null;
  let highestAmount = 0;
  for (const [cat, amt] of Object.entries(categoryTotals)) {
    if (amt > highestAmount) {
      highestAmount = amt;
      highestCategory = cat;
    }
  }

  return (
    <div className={styles.summaryContainer}>
      <div className={styles.card}>
        <h3>Total Budget</h3>
        <p>${budgetData.totalBudget.toFixed(2)}</p>
      </div>

      <div className={styles.card}>
        <h3>Total Expenses</h3>
        <p>${totalExpenses.toFixed(2)}</p>
      </div>

      <div className={styles.card}>
        <h3>Remaining</h3>
        <p>${remaining.toFixed(2)}</p>
      </div>

      <div className={styles.card}>
        <h3>Highest Expense Category</h3>
        <p>{highestCategory || 'N/A'}</p>
        <p>${highestAmount.toFixed(2)}</p>
      </div>
    </div>
  );
}

export default SummaryCards;
