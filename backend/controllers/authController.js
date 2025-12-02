const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "User already exists" });

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password_hash,
    });

    await newUser.save();

    res.json({ msg: "Registration successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid email" });

    const check = await bcrypt.compare(password, user.password_hash);
    if (!check) return res.status(400).json({ msg: "Incorrect password" });

    const token = jwt.sign(
      { user_id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ msg: "Login successful", token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
