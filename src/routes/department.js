import express from "express";
import DepartmentController from "../controllers/department.js";
import { verifyAccessToken } from "../middlewares/auth.js";

const router = express.Router();

const departmentController = new DepartmentController();

router.post("/", verifyAccessToken, departmentController.createDepartment);
router.get("/all", departmentController.getAllDepartmentsNoPagination);
router.get("/", departmentController.getAllDepartments);
router.get("/:deptcode", departmentController.getDepartmentByCode);
router.put(
  "/:deptcode",
  verifyAccessToken,
  departmentController.updateDepartment
);
router.delete(
  "/:deptcode",
  verifyAccessToken,
  departmentController.deleteDepartment
);

export default router;
