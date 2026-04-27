const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const router = express.Router();
const Survey = require("../models/Survey");
const {
  createSurvey,
  getSurveys,
  getSurveyById,
  updateSurvey,
  deleteSurvey,
  getMySurveys
} = require("../controllers/surveyController");
const { protect } = require("../middleware/authmw");
const { authorize } = require("../middleware/rolemw");

const uploadDir = path.join(__dirname, "..", "uploads", "surveys");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  }
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  }
});

// PUBLIC route - no auth required
router.post("/submit", imageUpload.array("images", 10), createSurvey);
router.get("/public", async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status) {
      query.status = status === "resolved" ? { $in: ["resolved", "completed"] } : status;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { reportName: { $regex: search, $options: "i" } },
        { surveyorName: { $regex: search, $options: "i" } },
        { areaSurveyed: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { problemsNoticed: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const surveys = await Survey.find(query).sort({ createdAt: -1 }).lean();

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
});

// Protected routes
router.get("/", protect, authorize("admin", "surveyor"), getSurveys);
router.get("/me", protect, authorize("surveyor"), getMySurveys);
router.get("/:id", protect, authorize("admin", "surveyor"), getSurveyById);
router.post("/create", protect, authorize("surveyor", "admin"), imageUpload.array("images", 10), createSurvey);
router.put("/:id", protect, authorize("admin"), updateSurvey);
router.delete("/:id", protect, authorize("admin"), deleteSurvey);

module.exports = router;

