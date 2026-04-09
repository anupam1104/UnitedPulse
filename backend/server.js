const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authroute");

// Load env variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware to read JSON
app.use(express.json({ limit: '10mb' }));

// CORS middleware for frontend HTML access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Auth routes
app.use("/api/auth", authRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const { protect } = require("./middleware/authmw");
const { authorize } = require("./middleware/rolemw");

// Admin only
app.get("/api/admin/dashboard", protect, authorize("admin"), (req, res) => {
  res.json({ message: "Admin dashboard" });
});

// Surveyor only
app.get("/api/surveyor/dashboard", protect, authorize("surveyor"), (req, res) => {
  res.json({ message: "Surveyor dashboard" });
});

// Public (any logged-in user)
app.get("/api/public/home", protect, (req, res) => {
  res.json({ message: "Public home" });
});

app.use("/api/test", require("./routes/testroute"));
