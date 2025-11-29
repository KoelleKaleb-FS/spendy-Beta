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
        setCategoryForecasts(categoryData);
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
    // Refresh every minute
    const interval = setInterval(fetchForecasts, 60000);
    return () => clearInterval(interval);
  }, [fetchForecasts]);

  if (!isAuthenticated) {
    return <p>Please log in to view budget forecasts.</p>;
  }

  if (loading) {
    return <p>Loading forecasts...</p>;
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  // Prepare data for trend chart
  const trendData = forecast
    ? [
        {
          day: "Today",
          current: forecast.currentSpend,
          projected: forecast.currentSpend,
          budget: forecast.budget,
        },
        {
          day: "End of Month",
          current: forecast.currentSpend,
          projected: forecast.projectedSpend,
          budget: forecast.budget,
        },
      ]
    : [];

  // Prepare data for category comparison
  const categoryData = Object.entries(categoryForecasts || {}).map(
    ([category, data]) => ({
      category,
      current: data.currentSpend,
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
            <h3>Spending Trend</h3>
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
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="#f56565"
                  strokeWidth={2}
                  name="Projected"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Forecasts */}
          {categoryData.length > 0 && (
            <div className={styles.chartContainer}>
              <h3>Category Forecasts</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="budget" fill="#667eea" name="Budget" />
                  <Bar dataKey="projected" fill="#f56565" name="Projected" />
                </BarChart>
              </ResponsiveContainer>

              {/* Category Details */}
              <div className={styles.categoryDetails}>
                {Object.entries(categoryForecasts || {}).map(
                  ([category, data]) => (
                    <div
                      key={category}
                      className={`${styles.categoryCard} ${
                        data.willOverspend ? styles.categoryWarning : ""
                      }`}
                    >
                      <h4>{category}</h4>
                      <p>
                        <strong>Current:</strong> $
                        {data.currentSpend.toFixed(2)}
                      </p>
                      <p>
                        <strong>Projected:</strong> $
                        {data.projectedSpend.toFixed(2)}
                      </p>
                      <p>
                        <strong>Budget:</strong> ${data.budget.toFixed(2)}
                      </p>
                      {data.willOverspend && (
                        <p className={styles.warning}>
                          ⚠️ Will overspend by $
                          {data.overspendAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BudgetForecasting;
