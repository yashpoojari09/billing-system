import express from "express";
import { authenticateJWT } from "../middlewares/auth";
import { authorizeRoles } from "../middlewares/rbac";
import { Role } from "@prisma/client";
import { createInventoryItem, getInventory, updateInventoryItem, deleteInventoryItem } from "../controllers/inventoryController";
import { validateTenant } from "../middlewares/auth";

const router = express.Router({ mergeParams: true });

// ✅ Create Inventory (Only Admin & Superadmin)
router.post(
  "/",
  authenticateJWT,
  authorizeRoles([Role.ADMIN, Role.SUPERADMIN]),
  validateTenant,
  createInventoryItem
);

// ✅ Get Inventory List (Admin, Manager, Superadmin)
router.get(
  "/",
  authenticateJWT,
  authorizeRoles([Role.ADMIN, Role.MANAGER, Role.SUPERADMIN]),
  validateTenant,
  getInventory
);

// ✅ Update Inventory Item (Only Admin & Superadmin)
router.put(
  "/:inventoryId",
  authenticateJWT,
  authorizeRoles([Role.ADMIN, Role.SUPERADMIN]),
  validateTenant,
  updateInventoryItem
);

// ✅ Delete Inventory Item (Only Superadmin)
router.delete(
  "/:inventoryId",
  authenticateJWT,
  authorizeRoles([Role.SUPERADMIN]),
  validateTenant,
  deleteInventoryItem
);
export default router;
