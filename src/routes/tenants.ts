import express from "express";
import { authenticateJWT } from "../middlewares/auth";
import { authorizeRoles } from "../middlewares/rbac";
import { validateTenant } from "../middlewares/auth";
import { Role } from "@prisma/client";
import { createTenant, getAllTenants, getTenantById, updateTenant, deleteTenant, createInvoice, previewInvoice } from "../controllers/tenantController";
import customerRoutes from "./customers";
import inventoryRoutes from "./inventory";
import taxationRoutes from "./taxation";

const router = express.Router();

// Only Superadmin can create tenants
router.post("/", authenticateJWT, authorizeRoles([Role.SUPERADMIN]), createTenant);

// Only Superadmin can view all tenants
router.get("/", authenticateJWT, authorizeRoles([Role.SUPERADMIN]),  getAllTenants);

// Admin & Superadmin can view their own tenant details
router.get("/:tenantId", authenticateJWT, authorizeRoles([Role.ADMIN, Role.SUPERADMIN]),validateTenant, getTenantById);

// Admin & Superadmin can update tenant details
router.put("/:tenantId", authenticateJWT, authorizeRoles([Role.ADMIN, Role.SUPERADMIN]), validateTenant, updateTenant);

// Only Superadmin can delete tenants
router.delete("/:tenantId", authenticateJWT, authorizeRoles([Role.SUPERADMIN]), validateTenant, deleteTenant);

// ✅ Nested route for customers under a tenant
router.use("/:tenantId/customers", validateTenant, customerRoutes);

// ✅ Nested route for customers under a tenant
router.use("/:tenantId/inventory", validateTenant, inventoryRoutes);

// ✅ Nested route for customers under a tenant
router.use("/:tenantId/taxation", validateTenant, taxationRoutes);

router.post("/:tenantId/invoice", authenticateJWT, authorizeRoles([Role.ADMIN, Role.SUPERADMIN, Role.MANAGER]), validateTenant, createInvoice);
router.post("/:tenantId/invoice/preview", authenticateJWT, authorizeRoles([Role.ADMIN, Role.SUPERADMIN, Role.MANAGER]), validateTenant, previewInvoice);



export default router;
