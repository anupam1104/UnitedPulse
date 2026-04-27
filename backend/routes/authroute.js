const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmw.js");
const {
  signupUser, loginUser,
  signupAdmin, loginAdmin,
  signupSurveyor, loginSurveyor,
  getMe
} = require("../controllers/authcontrol.js");

// Generic public user routes
router.post("/signup", signupUser);
router.post("/login", loginUser);

// Admin routes (use dedicated Admin model → unitedpulse.admins)
router.post("/administrator/signup", signupAdmin);
router.post("/administrator/login", loginAdmin);

// Surveyor routes (use dedicated Surveyor model → unitedpulse.surveyors)
router.post("/surveyor/signup", signupSurveyor);
router.post("/surveyor/login", loginSurveyor);

// Protected route — get current logged-in user profile
router.get("/me", protect, getMe);

module.exports = router;
