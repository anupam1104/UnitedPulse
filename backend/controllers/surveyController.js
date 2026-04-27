// surveyController.js - Handles survey CRUD (unitedpulse.surveys)

const Survey = require("../models/Survey");

// Create a new survey
const createSurvey = async (req, res) => {
  try {
    const body = req.body || {};
    const {
      // Existing API shape
      title,
      location,
      category,
      responses,
      // sdash.html submission shape
      reportName,
      surveyorName,
      surveyDate,
      areaSurveyed,
      problemsNoticed
    } = body;

    const resolvedTitle = title || reportName || problemsNoticed;
    if (!resolvedTitle) {
      return res.status(400).json({ message: "Survey title/reportName is required" });
    }

    const imagePaths = Array.isArray(req.files)
      ? req.files.map(file => `/uploads/surveys/${file.filename}`)
      : [];

    const textDescription = body.description || problemsNoticed || "";

    const survey = await Survey.create({
      reportName: reportName || resolvedTitle,
      surveyorName: surveyorName || (req.user?.name || ""),
      surveyDate: surveyDate || new Date(),
      areaSurveyed: areaSurveyed || location || "",
      problemsNoticed: problemsNoticed || title || "",
      images: imagePaths,
      title: resolvedTitle,
      description: textDescription,
      location: location || areaSurveyed || "",
      category: category || "other",
      responses,
      status: "pending",
      createdBy: req.user ? req.user._id : null
    });

    res.status(201).json({ message: "Survey created", survey });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all surveys
const getSurveys = async (req, res) => {
  try {
    const surveys = await Survey.find().sort({ createdAt: -1 });
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get personal surveys for logged in Surveyor
const getMySurveys = async (req, res) => {
  try {
    const surveys = await Survey.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).lean();
    
    // Format them the exact same way as the public route so dashboard renders properly
    const formatted = surveys.map((s) => {
      const baseDescription = s.description || s.problemsNoticed || "";
      return {
        _id: s._id,
        title: s.title || s.reportName || "Survey Report",
        reportName: s.reportName || s.title || `Survey #${s._id.toString().slice(-6)}`,
        surveyorName: s.surveyorName || "Surveyor",
        description: `Survey by ${s.surveyorName || "Surveyor"}${baseDescription ? " | " + baseDescription : ""}`,
        issue: (s.problemsNoticed || baseDescription || "").substring(0, 50),
        area: s.areaSurveyed || s.location || "N/A",
        areaSurveyed: s.areaSurveyed || s.location || "N/A",
        location: s.location || s.areaSurveyed || "N/A",
        category: s.category || "other",
        status: s.status === "completed" ? "resolved" : (s.status || "pending"),
        assignedTo: s.assignedTo || null,
        ngoAssigned: s.ngoAssigned || s.assignedTo || "None",
        images: Array.isArray(s.images) ? s.images : [],
        surveyDate: s.surveyDate || null,
        createdAt: s.createdAt || s.submittedAt
      };
    });

    res.json({ surveys: formatted, count: formatted.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get survey by ID
const getSurveyById = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: "Survey not found" });
    res.json(survey);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update survey status or assign surveyor/NGO
const updateSurvey = async (req, res) => {
  try {
    const { status, assignedTo, ngoAssigned } = req.body;
    
    const updatePayload = {};
    if (status !== undefined) updatePayload.status = status;
    if (assignedTo !== undefined) updatePayload.assignedTo = assignedTo;
    if (ngoAssigned !== undefined) updatePayload.ngoAssigned = ngoAssigned;

    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true }
    );
    if (!survey) return res.status(404).json({ message: "Survey not found" });
    res.json({ message: "Survey updated", survey });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete survey
const deleteSurvey = async (req, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);
    if (!survey) return res.status(404).json({ message: "Survey not found" });
    res.json({ message: "Survey deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSurvey,
  getSurveys,
  getSurveyById,
  updateSurvey,
  deleteSurvey,
  getMySurveys
};

