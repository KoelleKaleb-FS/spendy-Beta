import React, { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import styles from "../styles/BudgetForecasting.module.css";

function BudgetForecasting() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [forecast, setForecast] = useState(null);
  const [categoryForecasts, setCategoryForecasts] = useState({});
  const [upcomingExpenses, setUpcomingExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const fetchForecasts = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const token = await getAccessTokenSilently({
        audience: "https://spendy-api",
      });

      // Fetch overall forecast
      const forecastRes = await fetch(`${API_URL}/api/budget/forecast`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!forecastRes.ok) throw new Error("Failed to fetch forecast");
      const forecastData = await forecastRes.json();
      setForecast(forecastData);

      // Fetch category forecasts
      const categoryRes = await fetch(
        `${API_URL}/api/budget/forecast/by-category`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (categoryRes.ok) {
        const categoryData = await categoryRes.json();
        const formattedData = {};
        Object.entries(categoryData).forEach(([category, data]) => {
          formattedData[category] = {
            ...data,
            recurring: data.recurringAmount || 0,
            variable: data.currentSpend - (data.recurringAmount || 0),
          };
        });
        setCategoryForecasts(formattedData);
      }

      // Fetch upcoming recurring expenses (next 7 days)
      const upcomingRes = await fetch(`${API_URL}/api/recurring/upcoming/7`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (upcomingRes.ok) {
        const upcomingData = await upcomingRes.json();
        setUpcomingExpenses(upcomingData);
      }

      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAccessTokenSilently, API_URL]);

  useEffect(() => {
    fetchForecasts();
    const interval = setInterval(fetchForecasts, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchForecasts]);

  if (!isAuthenticated) return <p>Please log in to view budget forecasts.</p>;
  if (loading) return <p>Loading forecasts...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  // Generate daily trend for the month
  const generateDailyTrend = () => {
    if (!forecast) return [];
    const today = new Date();
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    const daysElapsed = today.getDate();
    const avgDailySpend = forecast.averageDailySpend || 0;

    const dailyTrend = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const projectedSpend =
        day <= daysElapsed
          ? forecast.currentSpend // past/current days
          : forecast.currentSpend + avgDailySpend * (day - daysElapsed); // future days

      dailyTrend.push({
        day: day.toString(),
        current: day <= daysElapsed ? forecast.currentSpend : null,
        projected: projectedSpend,
        budget: forecast.budget,
        overspend: projectedSpend > forecast.budget,
      });
    }

    return dailyTrend;
  };

  const trendData = generateDailyTrend();

  const categoryData = Object.entries(categoryForecasts).map(
    ([category, data]) => ({
      category,
      variable: data.variable,
      recurring: data.recurring,
      projected: data.projectedSpend,
      budget: data.budget,
    })
  );

  return (
    <div className={styles.container}>
      <h2>Budget Forecasting</h2>

      {forecast && (
        <>
          {/* Overall Forecast Summary */}
          <div className={styles.summaryGrid}>
            <div
              className={`${styles.summaryCard} ${
                forecast.willOverspend ? styles.warning : styles.success
              }`}
            >
              <h3>Current Spending</h3>
              <p className={styles.amount}>
                ${forecast.currentSpend.toFixed(2)}
              </p>
              <p className={styles.label}>
                of ${forecast.budget.toFixed(2)} budget
              </p>
            </div>

            <div
              className={`${styles.summaryCard} ${
                forecast.willOverspend ? styles.danger : styles.success
              }`}
            >
              <h3>Projected End of Month</h3>
              <p className={styles.amount}>
                ${forecast.projectedSpend.toFixed(2)}
              </p>
              <p className={styles.label}>
                {forecast.percentOfBudget}% of budget
              </p>
            </div>

            <div
              className={`${styles.summaryCard} ${
                forecast.willOverspend ? styles.danger : styles.success
              }`}
            >
              <h3>Status</h3>
              <p className={styles.status}>
                {forecast.willOverspend ? (
                  <>
                    ⚠️ Will Overspend
                    <br />
                    <small>${forecast.overspendAmount.toFixed(2)}</small>
                  </>
                ) : (
                  <>
                    ✅ On Track
                    <br />
                    <small>
                      ${(forecast.budget - forecast.projectedSpend).toFixed(2)}{" "}
                      remaining
                    </small>
                  </>
                )}
              </p>
            </div>

            <div className={styles.summaryCard}>
              <h3>Daily Average</h3>
              <p className={styles.amount}>
                ${forecast.averageDailySpend.toFixed(2)}
              </p>
              <p className={styles.label}>per day</p>
            </div>
          </div>

          {/* Trend Chart */}
          <div className={styles.chartContainer}>
            <h3>Spending Trend (Daily Projection)</h3>
            <p className={styles.chartNote}>
              <span style={{ color: "#f56565" }}>●</span> Red dots indicate days
              where projected spending exceeds your budget
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="budget"
                  stroke="#667eea"
                  strokeWidth={2}
                  name="Budget"
                />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="#48bb78"
                  strokeWidth={2}
                  name="Current"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="#e0a0ff"
                  strokeWidth={2}
                  name="Projected"
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (!payload) return null;
                    const isOverspend = payload.overspend;
                    const fill = isOverspend ? "#f56565" : "#e0a0ff";
                    const radius = isOverspend ? 5 : 3;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={fill}
                        stroke={fill}
                        strokeWidth={1}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Forecast Chart */}
          {categoryData.length > 0 && (
            <div className={styles.chartContainer}>
              <h3>Category Forecasts (Recurring vs Variable)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="recurring" fill="#667eea" name="Recurring" />
                  <Bar dataKey="variable" fill="#48bb78" name="Variable" />
                  <Bar
                    dataKey="projected"
                    fill="#f56565"
                    name="Projected Total"
                  />
                </BarChart>
              </ResponsiveContainer>

              <div className={styles.categoryDetails}>
                {Object.entries(categoryForecasts).map(([category, data]) => (
                  <div
                    key={category}
                    className={`${styles.categoryCard} ${
                      data.willOverspend ? styles.categoryWarning : ""
                    }`}
                  >
                    <h4>{category}</h4>
                    <p>
                      <strong>Recurring:</strong> ${data.recurring.toFixed(2)}
                    </p>
                    <p>
                      <strong>Variable:</strong> ${data.variable.toFixed(2)}
                    </p>
                    <p>
                      <strong>Projected Total:</strong> $
                      {data.projectedSpend.toFixed(2)}
                    </p>
                    <p>
                      <strong>Budget:</strong> ${data.budget.toFixed(2)}
                    </p>
                    {data.willOverspend && (
                      <p className={styles.warning}>
                        ⚠️ Will overspend by ${data.overspendAmount.toFixed(2)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Recurring Expenses */}
          {upcomingExpenses.length > 0 && (
            <div className={styles.chartContainer}>
              <h3>Upcoming Recurring Expenses (Next 7 Days)</h3>
              <div className={styles.upcomingList}>
                {upcomingExpenses.map((expense, idx) => {
                  const today = new Date();
                  const nextDate = new Date(expense.nextDate);
                  const daysUntil = Math.ceil(
                    (nextDate - today) / (1000 * 60 * 60 * 24)
                  );

                  // Color code by urgency
                  let urgencyClass = styles.upcomingNormal;
                  if (daysUntil <= 1) urgencyClass = styles.upcomingHigh;
                  else if (daysUntil <= 3) urgencyClass = styles.upcomingMedium;

                  // Color code by category
                  let categoryColor = "#667eea";
                  switch (expense.category) {
                    case "Food":
                      categoryColor = "#48bb78";
                      break;
                    case "Utilities":
                      categoryColor = "#f6ad55";
                      break;
                    case "Rent":
                      categoryColor = "#f56565";
                      break;
                    case "Entertainment":
                      categoryColor = "#9f7aea";
                      break;
                    case "Other":
                      categoryColor = "#4fd1c5";
                      break;
                    default:
                      break;
                  }

                  return (
                    <div
                      key={idx}
                      className={`${styles.upcomingCard} ${urgencyClass}`}
                      style={{ borderLeft: `5px solid ${categoryColor}` }}
                    >
                      <p>
                        <strong>{expense.description}</strong> ($
                        {expense.amount.toFixed(2)})
                      </p>
                      <p>Category: {expense.category}</p>
                      <p>
                        Next Date: {nextDate.toLocaleDateString()} ({daysUntil}{" "}
                        days)
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BudgetForecasting;
