import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import styles from "../styles/RecurringExpenses.module.css";

const AVAILABLE_CATEGORIES = ["Food", "Utilities", "Rent", "Entertainment", "Other"];
const FREQUENCIES = ["daily", "weekly", "biweekly", "monthly", "yearly"];

function RecurringExpenses() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [monthlyImpact, setMonthlyImpact] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    frequency: "monthly",
    startDate: "",
    endDate: "",
  });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Fetch recurring expenses
  const fetchRecurringExpenses = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently({
        audience: "https://spendy-api",
      });

      const res = await fetch(`${API_URL}/api/recurring`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch recurring expenses");

      const data = await res.json();
      setRecurringExpenses(data);
      setError("");

      // Fetch monthly impact
      const impactRes = await fetch(`${API_URL}/api/recurring/monthly-impact`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (impactRes.ok) {
        const impactData = await impactRes.json();
        setMonthlyImpact(impactData.monthlyImpact);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently, API_URL]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecurringExpenses();
    }
  }, [isAuthenticated, fetchRecurringExpenses]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.description || !formData.amount || !formData.category || !formData.startDate) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const token = await getAccessTokenSilently({
        audience: "https://spendy-api",
      });

      const url = editingId
        ? `${API_URL}/api/recurring/${editingId}`
        : `${API_URL}/api/recurring`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error(`Failed to ${editingId ? "update" : "add"} recurring expense`);

      setFormData({
        description: "",
        amount: "",
        category: "",
        frequency: "monthly",
        startDate: "",
        endDate: "",
      });
      setEditingId(null);
      setError("");
      await fetchRecurringExpenses();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this recurring expense?")) return;

    try {
      const token = await getAccessTokenSilently({
        audience: "https://spendy-api",
      });

      const res = await fetch(`${API_URL}/api/recurring/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete recurring expense");

      setError("");
      await fetchRecurringExpenses();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(expense) {
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      frequency: expense.frequency,
      startDate: expense.startDate.split("T")[0],
      endDate: expense.endDate ? expense.endDate.split("T")[0] : "",
    });
    setEditingId(expense._id);
  }

  function getMonthlyAmount(amount, frequency) {
    switch (frequency) {
      case "daily":
        return (amount * 30).toFixed(2);
      case "weekly":
        return (amount * 4.33).toFixed(2);
      case "biweekly":
        return (amount * 2.17).toFixed(2);
      case "monthly":
        return amount.toFixed(2);
      case "yearly":
        return (amount / 12).toFixed(2);
      default:
        return amount.toFixed(2);
    }
  }

  return (
    <div className={styles.container}>
      <h2>Recurring Expenses</h2>

      {/* Monthly Impact Summary */}
      <div className={styles.summary}>
        <h3>Monthly Impact of Recurring Expenses</h3>
        <p className={styles.amount}>${monthlyImpact.toFixed(2)}</p>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <h3>{editingId ? "Edit" : "Add"} Recurring Expense</h3>

        <input
          type="text"
          placeholder="Description (e.g., Netflix Subscription)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />

        <input
          type="number"
          placeholder="Amount"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          min="0"
          step="0.01"
          required
        />

        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
        >
          <option value="">Select Category</option>
          {AVAILABLE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
          required
        >
          {FREQUENCIES.map((freq) => (
            <option key={freq} value={freq}>
              {freq.charAt(0).toUpperCase() + freq.slice(1)}
            </option>
          ))}
        </select>

        <label>
          Start Date:
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </label>

        <label>
          End Date (Optional):
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </label>

        <button type="submit">{editingId ? "Update" : "Add"} Recurring Expense</button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormData({
                description: "",
                amount: "",
                category: "",
                frequency: "monthly",
                startDate: "",
                endDate: "",
              });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* List of Recurring Expenses */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className={styles.list}>
          <h3>Your Recurring Expenses</h3>
          {recurringExpenses.length === 0 ? (
            <p>No recurring expenses yet</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Frequency</th>
                  <th>Monthly Impact</th>
                  <th>Category</th>
                  <th>Start Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recurringExpenses.map((expense) => (
                  <tr key={expense._id}>
                    <td>{expense.description}</td>
                    <td>${expense.amount.toFixed(2)}</td>
                    <td>{expense.frequency}</td>
                    <td>${getMonthlyAmount(expense.amount, expense.frequency)}</td>
                    <td>{expense.category}</td>
                    <td>{new Date(expense.startDate).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => handleEdit(expense)} className={styles.editBtn}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(expense._id)} className={styles.deleteBtn}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default RecurringExpenses;
