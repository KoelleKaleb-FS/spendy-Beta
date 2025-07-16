import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { createBudget, getBudget } from './api';

const BudgetManager = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const [budget, setBudget] = useState(null);
  const [newBudget, setNewBudget] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBudget = async () => {
      if (!isAuthenticated) return;

      try {
        const token = await getAccessTokenSilently({
          audience: 'https://spendy-api',
        });

        const data = await getBudget(token);
        setBudget(data);
        setError('');
      } catch (err) {
        setError(err.message);
        setBudget(null);
      }
    };

    fetchBudget();
  }, [getAccessTokenSilently, isAuthenticated]);

  const handleCreateBudget = async () => {
    if (!isAuthenticated) {
      setError('You must be logged in to create a budget');
      return;
    }

    try {
      const token = await getAccessTokenSilently({
        audience: 'https://spendy-api',
      });

      const data = await createBudget(Number(newBudget), token);
      setBudget(data);
      setNewBudget('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Budget Manager</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
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
