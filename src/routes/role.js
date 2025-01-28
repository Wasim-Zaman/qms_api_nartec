import express from "express";
import controller from "../controllers/role.js";

const router = express.Router();

router.post("/", controller.createRole);
router.post("/assign", controller.assignRolesToUser);
router.get("/", controller.getAllRoles);
router.get("/all", controller.getAllRolesNoPagination);
router.get("/:id", controller.getRoleById);
router.put("/:id", controller.updateRole);
router.delete("/remove/:userId/:roleId", controller.removeRoleFromUser);
router.delete("/:id", controller.deleteRole);

export default router;
