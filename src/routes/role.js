import express from "express";
import controller from "../controllers/role.js";

const router = express.Router();

router.post("/", controller.createRole);
router.get("/", controller.getAllRoles);
router.get("/all", controller.getAllRolesNoPagination);
router.get("/:id", controller.getRoleById);
router.put("/:id", controller.updateRole);
router.delete("/:id", controller.deleteRole);

// Role assignment routes
router.post("/assign", controller.assignRoleToUser);
router.delete("/remove/:userId/:roleId", controller.removeRoleFromUser);

export default router;
