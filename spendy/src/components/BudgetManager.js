import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const BudgetManager = () => {
  const { getAccessTokenSilently} = useAuth0();
  const [budget, setBudget] = useState(null);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const token = await getAccessTokenSilently();
        console.log('Budget token:', token); // Debug token here

        const res = await fetch('https://spendy-beta.onrender.com/api/budget', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to fetch budget');
        }

        const data = await res.json();
        setBudget(data);
      } catch (err) {
        console.error('Fetch budget error:', err.message);
      }
    };

    fetchBudget();
  }, [getAccessTokenSilently]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      console.log('POST Budget token:', token); // Debug token here

      const res = await fetch('https://spendy-beta.onrender.com/api/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to set budget');
      }

      const data = await res.json();
      setBudget(data);
    } catch (err) {
      console.error('Set budget error:', err.message);
    }
  };

  return (
    <div>
      <h2>Budget Manager</h2>
      {budget ? (
        <div>
          <p><strong>Total Budget:</strong> ${budget.totalBudget}</p>
          <p><strong>Total Expenses:</strong> ${budget.expenses}</p>
          <p><strong>Remaining:</strong> ${budget.remaining}</p>
        </div>
      ) : (
        <p>No budget found.</p>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="Set Budget Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <button type="submit">Save Budget</button>
      </form>
    </div>
  );
};

export default BudgetManager;
