const mongoose = require("mongoose");

/* ---------------- USER ---------------- */

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  gender: { type: String },
  role: { type: String }
});

const User = mongoose.model("User", userSchema);

/* ---------------- CONTACT ---------------- */

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model("Contact", contactSchema);

/* ---------------- EXPORT ---------------- */

module.exports = { User, Contact };