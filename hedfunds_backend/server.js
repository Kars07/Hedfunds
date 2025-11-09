const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const errorHandler = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();

/* --- Middleware --- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* Session */
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

/* CORS */
const allowedOrigins = [
  "https://hedfunds.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

try {
  const frontendOrigin = new URL(process.env.FRONTEND_URL).origin;
  if (!allowedOrigins.includes(frontendOrigin)) allowedOrigins.push(frontendOrigin);
} catch {}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

/* --- MongoDB Connection --- */
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ Connected to MongoDB");

  // Ensure indexes
  const models = [
    require('./models/CreditScore'),
    require('./models/FundedLoan'),
    require('./models/FundingUtxo'),
    require('./models/LoanRequest'),
    require('./models/RepaidLoan'),
    require('./models/Wallet')
  ];

  models.forEach(model => model.createIndexes && model.createIndexes());
})
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

/* --- Routes --- */
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const loanRoutes = require('./routes/loanRoutes');

app.get("/", (req, res) => res.send("Welcome to the Hedfunds Backend API!"));

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/loans", loanRoutes);

/* --- Error handler --- */
app.use(errorHandler);

/* --- Server --- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));