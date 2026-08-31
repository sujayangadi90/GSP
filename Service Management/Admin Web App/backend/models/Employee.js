const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const EmployeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  address: {
    type: String,
    default: ""
  },
  profilePic: {
    type: String,
    default: ""
  },
  aadhar: {
    type: String,
    default: ""
  },
  drivingLicense: {
    type: String,
    default: ""
  },
  insurance: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },
  role: {
    type: String,
    default: "employee"
  }
}, { timestamps: true });

// Auto-increment Employee ID logic on pre-save (e.g. EMP-1001)
EmployeeSchema.pre("save", async function (next) {
  if (this.isNew && !this.employeeId) {
    try {
      const lastEmployee = await this.constructor.findOne({}, {}, { sort: { "createdAt": -1 } });
      let nextNum = 1001;
      if (lastEmployee && lastEmployee.employeeId) {
        const match = lastEmployee.employeeId.match(/\d+/);
        if (match) {
          nextNum = parseInt(match[0], 10) + 1;
        }
      }
      this.employeeId = "EMP-" + nextNum;
    } catch (err) {
      return next(err);
    }
  }

  // Hash password before saving if modified
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
EmployeeSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Employee", EmployeeSchema);
