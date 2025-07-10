import React, { useState, useEffect } from 'react';
import { createBudget, getBudget } from './api';

const BudgetManager = () => {
  const [budget, setBudget] = useState(null);
  const [newBudget, setNewBudget] = useState('');

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const data = await getBudget();
        setBudget(data);
      } catch (err) {
        console.error(err.message);
      }
    };

    fetchBudget();
  }, []);

  const handleCreateBudget = async () => {
    try {
      const data = await createBudget(Number(newBudget));
      setBudget(data);
      setNewBudget('');
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div>
      <h1>Budget Manager</h1>
      {budget ? (
        <div>
          <p>Total Budget: ${budget.totalBudget}</p>
          <p>Expenses: ${budget.expenses || 0}</p>
          <p>Remaining: ${budget.remaining}</p>
        </div>
      ) : (
        <p>No budget found. Create one below:</p>
      )}
      <input
        type="number"
        placeholder="Enter total budget"
        value={newBudget}
        onChange={(e) => setNewBudget(e.target.value)}
      />
      <button onClick={handleCreateBudget}>Create Budget</button>
    </div>
  );
};

export default BudgetManager;
