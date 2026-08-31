const express = require("express");
const {
  employeeLogin,
  getEmployeeMe,
  getEmployeeHistory,
  clockIn,
  clockOut,
  getAdminAttendance,
  getAttendanceStats,
  correctAttendance
} = require("../controllers/attendanceController");
const { protect, authorize } = require("../middleware/auth");
const { protectEmployee } = require("../middleware/employeeAuth");
const upload = require("../middleware/upload");

const router = express.Router();

// Public Employee Login
router.post("/login", employeeLogin);

// Employee Portal Protected Routes
router.get("/me", protectEmployee, getEmployeeMe);
router.get("/my-history", protectEmployee, getEmployeeHistory);
router.post("/clock-in", protectEmployee, upload.single("selfie"), clockIn);
router.post("/clock-out", protectEmployee, clockOut);

// Admin Attendance Routes
router.get("/admin/records", protect, authorize("admin"), getAdminAttendance);
router.get("/admin/stats", protect, authorize("admin"), getAttendanceStats);
router.patch("/admin/correct/:id", protect, authorize("admin"), correctAttendance);

module.exports = router;
