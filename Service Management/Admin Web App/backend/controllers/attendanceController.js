const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");

const generateToken = (id, role = "employee") => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "supersecretjwtkeygsp123", {
    expiresIn: "30d"
  });
};

// Helper: Get local date string YYYY-MM-DD (IST offset +5:30)
const getTodayDateString = () => {
  const now = new Date();
  // Adjust to IST timezone offset (+5.5 hrs)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().split("T")[0];
};

// Helper: Auto clock out any attendance records from previous days still in 'clocked_in' status at 12:00 AM midnight
const performAutoClockOut = async () => {
  try {
    const todayStr = getTodayDateString();
    const staleRecords = await Attendance.find({
      status: "clocked_in",
      date: { $lt: todayStr }
    });

    for (const rec of staleRecords) {
      if (!rec.date) continue;
      const parts = rec.date.split("-").map(Number);
      if (parts.length === 3) {
        const [year, month, day] = parts;
        // 23:59:59 IST = 18:29:59 UTC
        const midnightClockOut = new Date(Date.UTC(year, month - 1, day, 18, 29, 59));
        const clockIn = rec.clockInTime ? new Date(rec.clockInTime) : new Date(Date.UTC(year, month - 1, day, 3, 30, 0));
        const diffMs = midnightClockOut.getTime() - clockIn.getTime();
        const duration = Math.max(0, Math.round(diffMs / 60000));

        rec.clockOutTime = midnightClockOut;
        rec.durationMinutes = duration;
        rec.status = "completed";
        rec.isAutoClockOut = true;
        rec.autoClockOutNote = "Auto clocked out at 12:00 AM midnight";
        await rec.save();
      }
    }
  } catch (err) {
    console.error("Error in performAutoClockOut:", err);
  }
};

// @desc    Employee login
// @route   POST /api/attendance/login
// @access  Public
const employeeLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Please provide phone number and password" });
    }

    const cleanPhone = phone.trim();
    const employee = await Employee.findOne({ phone: cleanPhone });

    if (!employee) {
      return res.status(401).json({ message: "Invalid phone number or password" });
    }

    const isMatch = await employee.comparePassword(password.trim());
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid phone number or password" });
    }

    if (employee.status === "inactive") {
      return res.status(403).json({
        message: "Your employee account has been deactivated. Please contact your GSP Administrator."
      });
    }

    const token = generateToken(employee._id, "employee");

    res.json({
      token,
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        phone: employee.phone,
        address: employee.address,
        profilePic: employee.profilePic,
        status: employee.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in employee profile & today attendance state
// @route   GET /api/attendance/me
// @access  Private/Employee
const getEmployeeMe = async (req, res) => {
  try {
    await performAutoClockOut();
    const employee = req.employee;
    const todayStr = getTodayDateString();

    const todayAttendance = await Attendance.findOne({
      employee: employee._id,
      date: todayStr
    });

    res.json({
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        phone: employee.phone,
        address: employee.address,
        profilePic: employee.profilePic,
        status: employee.status
      },
      todayDate: todayStr,
      todayAttendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee personal attendance history
// @route   GET /api/attendance/my-history
// @access  Private/Employee
const getEmployeeHistory = async (req, res) => {
  try {
    const employee = req.employee;
    const history = await Attendance.find({ employee: employee._id })
      .sort({ date: -1 })
      .limit(60);

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Employee Clock-In
// @route   POST /api/attendance/clock-in
// @access  Private/Employee
const clockIn = async (req, res) => {
  try {
    await performAutoClockOut();
    const employee = req.employee;
    const { lat, lng, address } = req.body;

    if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) {
      return res.status(400).json({ message: "GPS Location (latitude and longitude) is mandatory for clocking in." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Live selfie photo is mandatory for clocking in." });
    }

    const todayStr = getTodayDateString();

    // Check if record already exists for today
    const existing = await Attendance.findOne({
      employee: employee._id,
      date: todayStr
    });

    if (existing) {
      if (existing.status === "completed") {
        return res.status(400).json({
          message: "You have already completed your attendance for today (" + todayStr + ")."
        });
      }
      if (existing.status === "clocked_in") {
        return res.status(400).json({
          message: "You are already clocked in for today (" + todayStr + ")."
        });
      }
    }

    const selfiePath = 'uploads/' + req.file.filename;
    const serverTime = new Date();

    const attendance = new Attendance({
      employee: employee._id,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      date: todayStr,
      clockInTime: serverTime,
      clockInLocation: {
        lat: Number(lat),
        lng: Number(lng),
        address: address ? address.trim() : ""
      },
      clockInSelfie: selfiePath,
      status: "clocked_in"
    });

    const saved = await attendance.save();
    res.status(201).json({
      message: "Clock In successful!",
      attendance: saved
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Employee Clock-Out
// @route   POST /api/attendance/clock-out
// @access  Private/Employee
const clockOut = async (req, res) => {
  try {
    const employee = req.employee;
    const { lat, lng, address } = req.body;

    if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) {
      return res.status(400).json({ message: "GPS Location (latitude and longitude) is mandatory for clocking out." });
    }

    const todayStr = getTodayDateString();

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: todayStr
    });

    if (!attendance) {
      return res.status(400).json({ message: "No active clock-in found for today (" + todayStr + "). Please clock in first." });
    }

    if (attendance.status === "completed") {
      return res.status(400).json({ message: "You have already clocked out for today." });
    }

    const serverTime = new Date();
    attendance.clockOutTime = serverTime;
    attendance.clockOutLocation = {
      lat: Number(lat),
      lng: Number(lng),
      address: address ? address.trim() : ""
    };
    attendance.status = "completed";

    // Duration in minutes
    if (attendance.clockInTime) {
      const diffMs = serverTime.getTime() - new Date(attendance.clockInTime).getTime();
      attendance.durationMinutes = Math.max(0, Math.round(diffMs / 60000));
    }

    const updated = await attendance.save();
    res.json({
      message: "Clock Out successful!",
      attendance: updated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Get all attendance records with filters
// @route   GET /api/attendance/admin/records
// @access  Private/Admin
const getAdminAttendance = async (req, res) => {
  try {
    await performAutoClockOut();
    const { employeeId, employee, date, startDate, endDate, status, search } = req.query;
    let query = {};

    if (employeeId) {
      query.employeeId = employeeId;
    }
    if (employee) {
      query.employee = employee;
    }
    if (status && status !== "all") {
      query.status = status;
    }

    if (date) {
      query.date = date;
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    if (search) {
      const s = search.trim();
      query.$or = [
        { employeeName: { $regex: s, $options: "i" } },
        { employeeId: { $regex: s, $options: "i" } }
      ];
    }

    const records = await Attendance.find(query)
      .populate("employee", "name phone profilePic employeeId")
      .sort({ date: -1, clockInTime: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Get attendance statistics
// @route   GET /api/attendance/admin/stats
// @access  Private/Admin
const getAttendanceStats = async (req, res) => {
  try {
    await performAutoClockOut();
    const { date } = req.query;
    const targetDate = date || getTodayDateString();

    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: "active" });
    const inactiveEmployees = await Employee.countDocuments({ status: "inactive" });

    const dateAttendances = await Attendance.find({ date: targetDate });

    const presentToday = dateAttendances.length;
    const currentlyClockedIn = dateAttendances.filter(a => a.status === "clocked_in").length;
    const completedToday = dateAttendances.filter(a => a.status === "completed" || a.status === "corrected").length;
    const missingClockOut = dateAttendances.filter(a => a.status === "missing_clock_out").length;
    const notClockedIn = Math.max(0, activeEmployees - presentToday);

    res.json({
      targetDate,
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      presentToday,
      currentlyClockedIn,
      completedToday,
      missingClockOut,
      notClockedIn
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Correct attendance with audit trail
// @route   PATCH /api/attendance/admin/correct/:id
// @access  Private/Admin
const correctAttendance = async (req, res) => {
  try {
    const { clockInTime, clockOutTime, reason, status } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Reason for attendance correction is required for the audit trail" });
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    const previousData = {
      clockInTime: attendance.clockInTime,
      clockOutTime: attendance.clockOutTime,
      status: attendance.status,
      durationMinutes: attendance.durationMinutes
    };

    if (clockInTime) {
      attendance.clockInTime = new Date(clockInTime);
    }
    if (clockOutTime) {
      attendance.clockOutTime = new Date(clockOutTime);
    }
    if (status) {
      attendance.status = status;
    } else if (attendance.clockOutTime) {
      attendance.status = "corrected";
    }

    // Recalculate duration
    if (attendance.clockInTime && attendance.clockOutTime) {
      const diffMs = new Date(attendance.clockOutTime).getTime() - new Date(attendance.clockInTime).getTime();
      attendance.durationMinutes = Math.max(0, Math.round(diffMs / 60000));
    }

    attendance.isCorrected = true;

    const newData = {
      clockInTime: attendance.clockInTime,
      clockOutTime: attendance.clockOutTime,
      status: attendance.status,
      durationMinutes: attendance.durationMinutes
    };

    attendance.corrections.push({
      correctedBy: req.user ? req.user.name : "Admin",
      correctedAt: new Date(),
      previousData,
      newData,
      reason: reason.trim()
    });

    const updated = await attendance.save();
    res.json({
      message: "Attendance corrected successfully",
      attendance: updated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  employeeLogin,
  getEmployeeMe,
  getEmployeeHistory,
  clockIn,
  clockOut,
  getAdminAttendance,
  getAttendanceStats,
  correctAttendance,
  performAutoClockOut
};
