import React, { useState, useEffect, useCallback } from 'react';
import styles from '../styles/BudgetOverview.module.css';
import ExpenseTracker from './ExpenseTracker';
import SummaryCards from './SummaryCards';

const API_URL = process.env.REACT_APP_API_URL || 'https://spendy-beta.onrender.com/api';

// Use a fixed fake token for dev bypass
const token = 'fake-token-for-dev';

function BudgetOverview() {
  const [budgetData, setBudgetData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch budget data without Auth0 token call
  const fetchBudgetData = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/budget`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        setError('No budget found for your account.');
        setBudgetData(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch budget data');
      }

      const data = await response.json();
      setBudgetData(data);
      setError('');
    } catch (err) {
      setError(err.message);
      setBudgetData(null);
    }
  }, []);

  // Fetch expenses without Auth0 token call
  const fetchExpenses = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/expenses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        const cleanedData = data.map((exp) => ({
          ...exp,
          amount: typeof exp.amount === 'string' ? parseFloat(exp.amount) : exp.amount,
        }));
        setExpenses(cleanedData);
        setError('');
      } else {
        setError('Unexpected expenses API response format.');
      }
    } catch (err) {
      setError(err.message);
      setExpenses([]);
    }
  }, []);

  // Refresh both budget and expenses
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBudgetData(), fetchExpenses()]);
    setLoading(false);
  }, [fetchBudgetData, fetchExpenses]);

  // Call refresh on mount (no Auth0 required)
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Budget Overview</h1>

      {loading ? (
        <p>Loading your data...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <SummaryCards expenses={expenses} budgetData={budgetData} />
          <ExpenseTracker
            expenses={expenses}
            setExpenses={setExpenses}
            refreshBudget={refreshAllData}
          />
        </>
      )}
    </div>
  );
}

export default BudgetOverview;
