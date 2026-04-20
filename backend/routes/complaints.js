const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");
const { protect } = require("../middleware/authmw");
const { authorize } = require("../middleware/rolemw");

// PUBLIC route - no auth required - for public complaint form on pdash.html
router.post("/submit", async (req, res) => {
  try {
    const { name, phone, email, area, problem } = req.body;

    if (!name || !area || !problem) {
      return res.status(400).json({ error: "Name, area, and problem are required." });
    }

    const newComplaint = new Complaint({
      title: problem,
      description: `Complaint by ${name}${phone ? " | Phone: " + phone : ""}${email ? " | Email: " + email : ""}`,
      category: problem,
      location: area,
      status: "pending"
    });

    await newComplaint.save();

    res.status(201).json({ message: "Complaint submitted successfully", complaint: newComplaint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all complaints - for dashboard table
router.get("/", protect, authorize(["admin", "surveyor"]), async (req, res) => {
  try {
    const { status, category, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const complaints = await Complaint.find(query)
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    // Format for frontend table
    const formatted = complaints.map(c => ({
      id: c._id,
      surveyorName: c.createdBy?.name || "Anonymous",
      reportName: c.title || `Report #${c._id.toString().slice(-6)}`,
      date: new Date(c.createdAt).toLocaleDateString(),
      area: c.location || "N/A",
      issue: c.description.substring(0, 50) + (c.description.length > 50 ? "..." : ""),
      status: c.status,
      ngoAssigned: c.assignedTo || "None"
    }));

    res.json({ complaints: formatted, count: formatted.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single complaint
router.get("/:id", protect, authorize(["admin", "surveyor"]), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("createdBy", "name")
      .lean();

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE complaint (enhanced)
router.post("/create", protect, authorize(["surveyor", "admin"]), async (req, res) => {
  try {
    const { title, description, category, location } = req.body;

    const newComplaint = new Complaint({
      title,
      description,
      category,
      location,
      createdBy: req.user._id,
      status: "pending"
    });

    await newComplaint.save();

    const populated = await Complaint.findById(newComplaint._id).populate("createdBy", "name");

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint: populated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE complaint (status, assignedTo)
router.put("/:id", protect, authorize(["admin"]), async (req, res) => {
  try {
    const { status, assignedTo, ...updates } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        assignedTo, 
        ...updates 
      },
      { new: true, runValidators: true }
    ).populate("createdBy", "name");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({
      message: "Complaint updated successfully",
      complaint
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE complaint
router.delete("/:id", protect, authorize(["admin"]), async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
