require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

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

// Auth0 middleware
const jwtCheck = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
});

// Dev bypass
const bypassJwt = (req, res, next) => {
  console.log('JWT verification bypassed for development');
  req.auth = { sub: 'dev-user' };
  next();
};

// Use real auth in production, bypass in dev
const useAuth = process.env.NODE_ENV === 'production' ? jwtCheck : bypassJwt;

// Routes
const expensesRouter = require('./routes/expenses');
const budgetRouter = require('./routes/budget');

app.use('/api/expenses', useAuth, expensesRouter);
app.use('/api/budget', useAuth, budgetRouter);

app.get('/', (req, res) => {
  res.send('Expense Tracker API is running');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
