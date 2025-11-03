const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const loanRoutes = require('./routes/loanRoutes');
const errorHandler = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Enable CORS for your frontend URL
const allowedOrigins = [
  "https://hedfunds.vercel.app/",
  "http://localhost:5173", 
  "http://localhost:5174",
  process.env.FRONTEND_URL
].filter(Boolean); // Remove any undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error("Blocked by CORS: ", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));


// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Auto-detect based on environment
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Required for cross-origin cookies
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// MongoDB connection
const mongoURI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to Mongo Atlas!');
    
    // Initialize collections and indexes
    const models = [
      require('./models/CreditScore'),
      require('./models/FundedLoan'),
      require('./models/FundingUtxo'),
      require('./models/LoanRequest'),
      require('./models/RepaidLoan'),
      require('./models/Wallet')
    ];
    
    for (const model of models) {
      await model.createIndexes();
    }
    console.log('Collections initialized!');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
};

connectDB();
  

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Hedfunds Backend API!");
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/loans', loanRoutes);

// Error handling middleware
app.use(errorHandler);

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});