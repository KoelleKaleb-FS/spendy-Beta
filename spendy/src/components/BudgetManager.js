import React, { useState, useEffect } from 'react';
import { createBudget, getBudget } from './api';
import { useAuth0 } from '@auth0/auth0-react';

const BudgetManager = () => {
  const { getAccessTokenSilently} = useAuth0();
  const [budget, setBudget] = useState(null);
  const [newBudget, setNewBudget] = useState('');

  useEffect(() => {
  const fetchBudget = async () => {
    try {
      const token = await getAccessTokenSilently({
        audience: 'https://spendy-api',  // ✅ Required
      });
      const data = await getBudget(token);
      setBudget(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  fetchBudget();
}, [getAccessTokenSilently]);


const handleCreateBudget = async () => {
  try {
    const token = await getAccessTokenSilently({
      audience: 'https://spendy-api',   // ✅ Required
    });
    console.log("Access Token:", token)
    const data = await createBudget(Number(newBudget), token);
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
