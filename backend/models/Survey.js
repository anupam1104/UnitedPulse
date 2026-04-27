// Survey.js - Survey model for unitedpulse.surveys collection

const mongoose = require("mongoose");

const surveySchema = new mongoose.Schema({
  reportName: {
    type: String,
    trim: true
  },
  surveyorName: {
    type: String,
    trim: true
  },
  surveyDate: {
    type: Date
  },
  areaSurveyed: {
    type: String,
    trim: true
  },
  problemsNoticed: {
    type: String,
    trim: true
  },
  images: [{
    type: String
  }],
  title: {
    type: String,
    required: [true, "Survey title is required"],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ["water", "health", "sanitation", "education", "road", "electricity", "other"],
    default: "other"
  },
  status: {
    type: String,
    enum: ["pending", "in-progress", "resolved", "completed"],
    default: "pending"
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Surveyor",
    default: null
  },
  ngoAssigned: {
    type: String,
    trim: true,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null
  },
  responses: [{
    question: String,
    answer: String
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.models.Survey || mongoose.model("Survey", surveySchema);

