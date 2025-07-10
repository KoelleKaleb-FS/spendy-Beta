require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors({
  origin: 'http://localhost:3000'
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Bypass JWT middleware for development
const bypassJwt = (req, res, next) => {
  console.log('JWT verification bypassed for development');
  req.auth = { sub: 'dev-user' }; // Simulate an authenticated user in req.auth
  next();
};

const expensesRouter = require('./routes/expenses');
const budgetRouter = require('./routes/budget');

// Use bypass middleware for all API routes
app.use('/api/expenses', (req, res, next) => {
  console.log('Authorization header:', req.headers.authorization);
  next();
}, bypassJwt, expensesRouter);

app.use('/api/budget', (req, res, next) => {
  console.log('Authorization header:', req.headers.authorization);
  next();
}, bypassJwt, budgetRouter);

// Public route for testing
app.get('/', (req, res) => {
  res.send('Expense Tracker API is running');
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
