require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// Enable CORS for all routes (allow all origins for development)
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));

app.use(express.json());

// Serve static files
app.use(express.static('public'));

const connectDB = require("./config/db");
const auth = require("./middleware/auth");
connectDB();

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ msg: "Backend is running" });
});

// Protected test route
app.get("/test-protected", auth, (req, res) => {
  res.json({ msg: "Protected route working", user: req.user });
});

app.use("/auth", require("./routes/authRoutes"));
app.use("/qr", require("./routes/qrRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
