const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");

// @desc    Get all employees with filters
// @route   GET /api/employees
// @access  Private/Admin
const getEmployees = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: "i" } },
        { employeeId: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } }
      ];
    }

    const employees = await Employee.find(query).select("-password").sort({ createdAt: -1 });

    // Quick stats
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: "active" });
    const inactiveEmployees = await Employee.countDocuments({ status: "inactive" });

    // Today attendance stats
    const todayStr = new Date().toISOString().split("T")[0];
    const todayAttendances = await Attendance.find({ date: todayStr });
    const presentToday = todayAttendances.length;
    const currentlyClockedIn = todayAttendances.filter(a => a.status === "clocked_in").length;
    const completedToday = todayAttendances.filter(a => a.status === "completed" || a.status === "corrected").length;
    const notClockedIn = Math.max(0, activeEmployees - presentToday);

    res.json({
      employees,
      stats: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        presentToday,
        currentlyClockedIn,
        completedToday,
        notClockedIn
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private/Admin
const createEmployee = async (req, res) => {
  try {
    const { name, phone, password, address, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Employee name is required" });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ message: "Password is required" });
    }

    const cleanPhone = phone.trim();
    const existing = await Employee.findOne({ phone: cleanPhone });
    if (existing) {
      return res.status(400).json({ message: "An employee with this phone number already exists" });
    }

    // Handle files if uploaded
    let profilePic = "";
    let aadhar = "";
    let drivingLicense = "";
    let insurance = "";

    if (req.files) {
      if (req.files.profilePic && req.files.profilePic[0]) {
        profilePic = req.files.profilePic[0].path.replace(/\\/g, "/").replace(/^.*uploads\//, "uploads/");
      }
      if (req.files.aadhar && req.files.aadhar[0]) {
        aadhar = req.files.aadhar[0].path.replace(/\\/g, "/").replace(/^.*uploads\//, "uploads/");
      }
      if (req.files.drivingLicense && req.files.drivingLicense[0]) {
        drivingLicense = req.files.drivingLicense[0].path.replace(/\\/g, "/").replace(/^.*uploads\//, "uploads/");
      }
      if (req.files.insurance && req.files.insurance[0]) {
        insurance = req.files.insurance[0].path.replace(/\\/g, "/").replace(/^.*uploads\//, "uploads/");
      }
    }

    const employee = new Employee({
      name: name.trim(),
      phone: cleanPhone,
      password: password.trim(),
      address: address ? address.trim() : "",
      profilePic,
      aadhar,
      drivingLicense,
      insurance,
      status: status || "active"
    });

    const saved = await employee.save();
    res.status(201).json({
      _id: saved._id,
      employeeId: saved.employeeId,
      name: saved.name,
      phone: saved.phone,
      address: saved.address,
      profilePic: saved.profilePic,
      aadhar: saved.aadhar,
      drivingLicense: saved.drivingLicense,
      insurance: saved.insurance,
      status: saved.status,
      createdAt: saved.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Private/Admin
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("-password");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const recentAttendance = await Attendance.find({ employee: employee._id })
      .sort({ date: -1 })
      .limit(30);

    res.json({
      employee,
      recentAttendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const { name, phone, password, address, status } = req.body;

    if (phone && phone.trim() !== employee.phone) {
      const duplicate = await Employee.findOne({ phone: phone.trim(), _id: { $ne: employee._id } });
      if (duplicate) {
        return res.status(400).json({ message: "Phone number already in use by another employee" });
      }
      employee.phone = phone.trim();
    }

    if (name) employee.name = name.trim();
    if (address !== undefined) employee.address = address.trim();
    if (status) employee.status = status;
    if (password && password.trim().length > 0) {
      employee.password = password.trim();
    }

    // Handle files if uploaded
    if (req.files) {
      if (req.files.profilePic && req.files.profilePic[0]) {
        employee.profilePic = req.files.profilePic[0].path.replace(/\\/g, "/").replace(/^.*uploads\//, "uploads/");
      }
      if (req.files.aadhar && req.files.aadhar[0]) {
        employee.aadhar = req.files.aadhar[0].path.replace(/\\/g, "/").replace(/^.*uploads\//, "uploads/");
      }
      if (req.files.drivingLicense && req.files.drivingLicense[0]) {
        employee.drivingLicense = req.files.drivingLicense[0].path.replace(/\\/g, "/").replace(/^.*uploads\//, "uploads/");
      }
      if (req.files.insurance && req.files.insurance[0]) {
        employee.insurance = req.files.insurance[0].path.replace(/\\/g, "/").replace(/^.*uploads\//, "uploads/");
      }
    }

    const updated = await employee.save();
    res.json({
      _id: updated._id,
      employeeId: updated.employeeId,
      name: updated.name,
      phone: updated.phone,
      address: updated.address,
      profilePic: updated.profilePic,
      aadhar: updated.aadhar,
      drivingLicense: updated.drivingLicense,
      insurance: updated.insurance,
      status: updated.status,
      updatedAt: updated.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle employee status
// @route   PATCH /api/employees/:id/toggle
// @access  Private/Admin
const toggleEmployeeStatus = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.status = employee.status === "active" ? "inactive" : "active";
    await employee.save();

    res.json({
      message: "Employee status changed to " + employee.status,
      status: employee.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await Employee.findByIdAndDelete(req.params.id);
    // Remove related attendance records
    await Attendance.deleteMany({ employee: req.params.id });

    res.json({ message: "Employee and associated records deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee
};
