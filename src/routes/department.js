import express from "express";
import DepartmentController from "../controllers/department.js";
import { verifyAccessToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", verifyAccessToken, DepartmentController.createDepartment);
router.get("/all", DepartmentController.getAllDepartmentsNoPagination);
router.get("/", DepartmentController.getAllDepartments);
router.get("/:deptcode", DepartmentController.getDepartmentByCode);
router.put(
  "/:deptcode",
  verifyAccessToken,
  DepartmentController.updateDepartment
);
router.delete(
  "/:deptcode",
  verifyAccessToken,
  DepartmentController.deleteDepartment
);

export default router;
