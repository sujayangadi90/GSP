const express = require("express");
const {
  getEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee
} = require("../controllers/employeeController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

const employeeUploadFields = upload.fields([
  { name: "profilePic", maxCount: 1 },
  { name: "aadhar", maxCount: 1 },
  { name: "drivingLicense", maxCount: 1 },
  { name: "insurance", maxCount: 1 }
]);

router.use(protect);
router.use(authorize("admin"));

router.route("/")
  .get(getEmployees)
  .post(employeeUploadFields, createEmployee);

router.route("/:id")
  .get(getEmployeeById)
  .put(employeeUploadFields, updateEmployee)
  .delete(deleteEmployee);

router.route("/:id/toggle")
  .patch(toggleEmployeeStatus);

module.exports = router;
