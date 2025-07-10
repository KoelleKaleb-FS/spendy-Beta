import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import SummaryCards from './SummaryCards';
import styles from '../styles/ExpenseTracker.module.css';

function getExpensesByCategory(expenses) {
  const categorySums = {};

  expenses.forEach(({ category, amount }) => {
    if (!category) return;
    if (!categorySums[category]) {
      categorySums[category] = 0;
    }
    categorySums[category] += amount;
  });

  return Object.entries(categorySums).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));
}

const categories = ['Food', 'Utilities', 'Rent', 'Entertainment', 'Other'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A'];

function ExpenseTracker({ budgetData, refreshBudget }) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const [expenses, setExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: '',
    date: '',
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // New state for budget goals (default example values)
  const [budgetGoals, setBudgetGoals] = useState({
    Food: 500,
    Utilities: 200,
    Rent: 1000,
    Entertainment: 150,
    Other: 100,
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchExpenses() {
      setLoading(true);
      try {
        const token = await getAccessTokenSilently({
          audience: 'https://spendy-api',
          scope: 'read:expenses write:budget',
        });

        const expensesResponse = await fetch('/api/expenses', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const expensesData = await expensesResponse.json();
        if (Array.isArray(expensesData)) {
          const cleanedData = expensesData.map((exp) => ({
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
      } finally {
        setLoading(false);
      }
    }

    fetchExpenses();
  }, [isAuthenticated, getAccessTokenSilently]);

  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    return (!start || expenseDate >= start) && (!end || expenseDate <= end);
  });

  // Handle budget goal changes per category
  function handleBudgetGoalChange(category, value) {
    if (value === '' || value < 0) return; // Prevent negative or empty
    setBudgetGoals((prevGoals) => ({
      ...prevGoals,
      [category]: Number(value),
    }));
  }

  async function handleAddExpense(e) {
    e.preventDefault();

    const parsedAmount = parseFloat(newExpense.amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setError('Please enter a valid amount.');
      return;
    }

    try {
      const token = await getAccessTokenSilently({
        audience: 'https://spendy-api',
      });

      const expenseToSend = { ...newExpense, amount: parsedAmount };

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseToSend),
      });

      if (!response.ok) {
        throw new Error('Failed to add expense');
      }

      const addedExpense = await response.json();
      setExpenses((prev) => [...prev, addedExpense]);
      setNewExpense({ description: '', amount: '', category: '', date: '' });
      setError('');

      if (refreshBudget) await refreshBudget();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveEdit(expense) {
    const parsedAmount = parseFloat(expense.amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setError('Please enter a valid amount.');
      return;
    }

    try {
      const token = await getAccessTokenSilently({
        audience: 'https://spendy-api',
      });

      const expenseToSend = { ...expense, amount: parsedAmount };

      const response = await fetch(`/api/expenses/${expense._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseToSend),
      });

      if (!response.ok) {
        throw new Error('Failed to update expense');
      }

      const updatedExpense = await response.json();
      setExpenses((prev) =>
        prev.map((exp) => (exp._id === updatedExpense._id ? updatedExpense : exp))
      );
      setEditingExpense(null);
      setError('');

      if (refreshBudget) await refreshBudget();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteExpense(id) {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      const token = await getAccessTokenSilently({
        audience: 'https://spendy-api',
      });

      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      setExpenses((prev) => prev.filter((exp) => exp._id !== id));
      setError('');

      if (refreshBudget) await refreshBudget();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleExportCSV() {
    const csvRows = [
      ['Description', 'Amount', 'Category', 'Date'],
      ...filteredExpenses.map((e) => [
        e.description,
        e.amount,
        e.category,
        new Date(e.date).toLocaleDateString(),
      ]),
    ];

    const csvContent = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const data = getExpensesByCategory(filteredExpenses);

  // Calculate total spent per category for progress bars
  const totalsByCategory = filteredExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      <h2>Expense Tracker</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loading ? (
        <p>Loading expenses...</p>
      ) : (
        <>
          <form onSubmit={handleAddExpense} className={styles.form}>
            <input
              type="text"
              placeholder="Description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              className={styles.input}
              required
            />
            <input
              type="number"
              placeholder="Amount"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              className={styles.input}
              required
              min="0"
              step="0.01"
            />
            <select
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              className={styles.input}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
              className={styles.input}
              required
            />
            <button type="submit" className={styles.button}>
              Add Expense
            </button>
          </form>

          {/* Budget Goals Section */}
          <div className={styles.budgetGoalsContainer}>
            <h3>Budget Goals by Category</h3>
            {categories.map((cat, i) => {
              const spent = totalsByCategory[cat] || 0;
              const goal = budgetGoals[cat] || 0;
              const percent = goal > 0 ? Math.min((spent / goal) * 100, 100) : 0;
              let progressColor = '#4caf50'; // green
              if (percent > 100) progressColor = '#f44336'; // red
              else if (percent > 75) progressColor = '#ff9800'; // orange

              return (
                <div key={cat} className={styles.budgetGoalRow}>
                  <label>{cat} Goal:</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={budgetGoals[cat]}
                    onChange={(e) => handleBudgetGoalChange(cat, e.target.value)}
                    className={styles.input}
                  />
                  <div className={styles.progressBarWrapper}>
                    <div
                      className={styles.progressBar}
                      style={{
                        width: `${percent}%`,
                        backgroundColor: progressColor,
                      }}
                    />
                  </div>
                  <span>
                    ${spent.toFixed(2)} / ${goal}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={styles.dateFilter}>
            <label>
              Start Date:
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.input}
              />
            </label>
            <label>
              End Date:
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={styles.input}
              />
            </label>
            <button onClick={handleExportCSV} className={styles.button}>
              Export CSV
            </button>
          </div>

          <div className={styles.expenseList}>
            {filteredExpenses.length === 0 ? (
              <p>No expenses added yet.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Description</th>
                    <th className={styles.th}>Amount ($)</th>
                    <th className={styles.th}>Category</th>
                    <th className={styles.th}>Date</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense._id}>
                      <td className={styles.td}>
                        {editingExpense && editingExpense._id === expense._id ? (
                          <input
                            type="text"
                            value={editingExpense.description}
                            onChange={(e) =>
                              setEditingExpense({ ...editingExpense, description: e.target.value })
                            }
                          />
                        ) : (
                          expense.description
                        )}
                      </td>
                      <td className={styles.td}>
                        {editingExpense && editingExpense._id === expense._id ? (
                          <input
                            type="number"
                            value={editingExpense.amount}
                            onChange={(e) =>
                              setEditingExpense({ ...editingExpense, amount: e.target.value })
                            }
                          />
                        ) : (
                          Number(expense.amount).toFixed(2)
                        )}
                      </td>
                      <td className={styles.td}>
                        {editingExpense && editingExpense._id === expense._id ? (
                          <select
                            value={editingExpense.category}
                            onChange={(e) =>
                              setEditingExpense({ ...editingExpense, category: e.target.value })
                            }
                          >
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        ) : (
                          expense.category
                        )}
                      </td>
                      <td className={styles.td}>
                        {editingExpense && editingExpense._id === expense._id ? (
                          <input
                            type="date"
                            value={editingExpense.date}
                            onChange={(e) =>
                              setEditingExpense({ ...editingExpense, date: e.target.value })
                            }
                          />
                        ) : (
                          new Date(expense.date).toLocaleDateString()
                        )}
                      </td>
                      <td className={styles.td}>
                        {editingExpense && editingExpense._id === expense._id ? (
                          <>
                            <button onClick={() => handleSaveEdit(editingExpense)}>Save</button>
                            <button onClick={() => setEditingExpense(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingExpense(expense)}>Edit</button>
                            <button onClick={() => handleDeleteExpense(expense._id)}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <SummaryCards expenses={filteredExpenses} />

          <h3>Expenses by Category</h3>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={data}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No expenses to display in chart.</p>
          )}
        </>
      )}
    </div>
  );
}

export default ExpenseTracker;
