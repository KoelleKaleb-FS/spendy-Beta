// Helper function to calculate forecast
function calculateForecast(expenses, budgetGoal, daysIntoMonth) {
  if (daysIntoMonth === 0) {
    // Always return an object, even when no days have passed
    return {
      currentSpend: 0,
      projectedSpend: budgetGoal,
      budget: budgetGoal,
      daysIntoMonth: 0,
      averageDailySpend: 0,
      willOverspend: false,
      overspendAmount: 0,
      percentOfBudget: 0,
    };
  }

  const averageDailySpend = expenses / daysIntoMonth;
  const daysRemainingInMonth = 30 - daysIntoMonth; // Approximate
  const projectedAdditionalSpend = averageDailySpend * daysRemainingInMonth;
  const projectedTotalSpend = expenses + projectedAdditionalSpend;

  return {
    currentSpend: expenses,
    projectedSpend: Math.round(projectedTotalSpend * 100) / 100,
    budget: budgetGoal,
    daysIntoMonth,
    averageDailySpend: Math.round(averageDailySpend * 100) / 100,
    willOverspend: projectedTotalSpend > budgetGoal,
    overspendAmount: Math.max(
      0,
      Math.round((projectedTotalSpend - budgetGoal) * 100) / 100
    ),
    percentOfBudget: Math.round((projectedTotalSpend / budgetGoal) * 100),
  };
}

// Helper to calculate days into current month
function getDaysIntoMonth() {
  const today = new Date();
  return today.getDate();
}

module.exports = {
  calculateForecast,
  getDaysIntoMonth,
};
