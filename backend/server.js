require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));