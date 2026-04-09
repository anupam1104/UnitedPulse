const express = require("express");
const router = express.Router();
const { signupUser, loginUser } = require("../controllers/authcontrol.js");

router.post("/signup", signupUser);
router.post("/login", loginUser);

// Role-specific routes

router.post("/administrator/signup", (req, res, next) => { req.body.role = "admin"; signupUser(req, res, next); });
router.post("/administrator/login", loginUser);
router.post("/surveyor/signup", (req, res, next) => { req.body.role = "surveyor"; signupUser(req, res, next); });
router.post("/surveyor/login", loginUser);

module.exports = router;