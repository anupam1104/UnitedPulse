// Admin.js - Administrator model for unitedpulse.admins collection

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [50, "Name cannot exceed 50 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"]
  },
  role: {
    type: String,
    default: "admin",
    enum: ["admin"]
  },
  phone: { type: String, trim: true },
  dob: { type: Date },
  address: { type: String, trim: true },
  organizationName: { type: String, trim: true },
  organizationContact: { type: String, trim: true },
  organizationEmail: { type: String, trim: true, lowercase: true },
  organizationAddress: { type: String, trim: true },
  securityQuestion: { type: String, trim: true },
  securityAnswer: { type: String, trim: true },
  passkey: { type: String, trim: true }
}, { timestamps: true });

adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

