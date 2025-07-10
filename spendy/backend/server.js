require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors({
  origin: 'https://spendy-beta.vercel.app',
  credentials: true,
}));

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware that just fakes an authenticated user for ALL requests
const fakeAuth = (req, res, next) => {
  req.auth = { sub: 'bypass-user' }; // Fake user ID
  next();
};

// Import your routers
const expensesRouter = require('./routes/expenses');
const budgetRouter = require('./routes/budget');

// Apply fakeAuth middleware to all API routes to bypass auth
app.use('/api/expenses', fakeAuth, expensesRouter);
app.use('/api/budget', fakeAuth, budgetRouter);

app.get('/', (req, res) => {
  res.send('Expense Tracker API is running without auth!');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
