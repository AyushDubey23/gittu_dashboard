require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 4000;

/* ===============================
   MongoDB Connection
================================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err));

/* ===============================
   Middleware
================================= */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

app.use(express.json());

/* ===============================
   Auth Middleware
================================= */
function requireAdmin(req, res, next) {
  const token = req.headers["x-auth-token"];
  if (!token) return res.status(401).json({ message: "Missing auth token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

/* ===============================
   Signup
================================= */
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, githubUsername, year, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!email.endsWith("@mmmut.ac.in")) {
      return res
        .status(400)
        .json({ message: "Use university email (@mmmut.ac.in)" });
    }

    const rollNumber = email.split("@")[0];

    const existing = await User.findOne({
      $or: [{ rollNumber }, { email }],
    });

    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      rollNumber,
      email,
      githubUsername,
      year,
      password: hashedPassword,
      role: "student",
    });

    res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   Login
================================= */
app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Identifier and password required" });
    }

    const user = await User.findOne({
      $or: [{ rollNumber: identifier }, { email: identifier }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      role: user.role,
      name: user.name,
      rollNumber: user.rollNumber,
      githubUsername: user.githubUsername,
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   Public Leaderboard
================================= */
app.get("/api/leaderboard", async (req, res) => {
  try {
    const users = await User.find().sort({ quizScore: -1 });

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      name: u.name,
      rollNumber: u.rollNumber,
      githubUsername: u.githubUsername,
      quizScore: u.quizScore,
      prCount: u.prCount,
      status: `${u.prCount}/5 PRs Completed`,
      qualified: u.prCount >= 5,
    }));

    res.json({ published: true, leaderboard });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   Admin Overview
================================= */
app.get("/api/admin/overview", requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ quizScore: -1 });

    res.json({
      totalRegistrations: users.length,
      students: users.map((u) => ({
        id: u._id,
        name: u.name,
        rollNumber: u.rollNumber,
        email: u.email,
        githubUsername: u.githubUsername,
        year: u.year,
        quizScore: u.quizScore,
        prCount: u.prCount,
      })),
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   Admin Update Participant
================================= */
app.put(
  "/api/admin/participant/:rollNumber",
  requireAdmin,
  async (req, res) => {
    try {
      const { quizScore, prCount } = req.body;

      const user = await User.findOne({
        rollNumber: req.params.rollNumber,
      });

      if (!user) {
        return res.status(404).json({ message: "Participant not found" });
      }

      if (quizScore !== undefined) user.quizScore = Number(quizScore);
      if (prCount !== undefined) user.prCount = Number(prCount);

      await user.save();

      res.json({
        rollNumber: user.rollNumber,
        quizScore: user.quizScore,
        prCount: user.prCount,
      });
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ===============================
   Admin Delete Participant
================================= */
app.delete(
  "/api/admin/participant/:rollNumber",
  requireAdmin,
  async (req, res) => {
    try {
      const user = await User.findOneAndDelete({
        rollNumber: req.params.rollNumber,
      });

      if (!user) {
        return res.status(404).json({ message: "Participant not found" });
      }

      res.json({ deleted: true });
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ===============================
   Start Server
================================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});