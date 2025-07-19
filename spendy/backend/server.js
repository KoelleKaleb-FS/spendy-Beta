require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { auth } = require('express-oauth2-jwt-bearer');

const app = express();

// CORS setup
const allowedOrigins = [
  'https://spendy-beta.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));


app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

  app.use('/api/budget', (req, res, next) => {
  console.log('Authorization header:', req.headers.authorization);
  next();
});


// Auth0 JWT middleware
const jwtCheck = auth({
  audience: 'https://spendy-api',
  issuerBaseURL: 'https://dev-rcl8pcpcwm5cxd17.us.auth0.com/',
  algorthim: ['RS256'],
});


// Import routers
const expensesRouter = require('./routes/expenses');
const budgetRouter = require('./routes/budget');

// Apply jwtCheck to API routes (real authentication)
app.use('/api/expenses', jwtCheck, expensesRouter);
app.use('/api/budget', jwtCheck, (req, res, next) => {
  console.log('User Auth Payload:', req.auth); 
  next();
}, budgetRouter);

app.get('/api/test-auth', jwtCheck, (req, res) => {
  console.log('✅ Test route hit. Decoded token:', req.auth);

  res.json({
    message: 'Token is valid!',
    authPayload: req.auth,
  });
});

// Root route (health check)
app.get('/', (req, res) => {
  res.send('Spendy API is running with Auth0 authentication!');
});

// Server listen
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
