const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");

const protectEmployee = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretjwtkeygsp123");
      req.employee = await Employee.findById(decoded.id).select("-password");
      if (!req.employee) {
        return res.status(401).json({ message: "Not authorized, employee record not found" });
      }
      if (req.employee.status === "inactive") {
        return res.status(403).json({ message: "Employee account is inactive. Please contact Administrator." });
      }
      next();
    } catch (error) {
      console.error("Employee Auth Error:", error.message);
      res.status(401).json({ message: "Not authorized, token invalid or expired" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, token missing" });
  }
};

module.exports = { protectEmployee };
