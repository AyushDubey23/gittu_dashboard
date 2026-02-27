const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  year: String,
  githubUsername: String,
  password: { type: String, required: true },
  quizScore: { type: Number, default: 0 },
  prCount: { type: Number, default: 0 },
  role: { type: String, default: "student" }
});

module.exports = mongoose.model("User", userSchema);