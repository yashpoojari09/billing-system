import express from "express";
import { authenticateJWT } from "../middlewares/auth";
import { authorizeRoles } from "../middlewares/rbac";
import { Role } from "@prisma/client";
import { createTaxRule, getTaxRules, deleteTaxRule, updateTaxRule } from "../controllers/taxationController";

const router = express.Router();

router.post("/", authenticateJWT, authorizeRoles([Role.ADMIN, Role.SUPERADMIN]), createTaxRule);
router.get("/", authenticateJWT, authorizeRoles([Role.ADMIN, Role.MANAGER, Role.SUPERADMIN]), getTaxRules);
// Only Admin & Superadmin can update tax rules
router.put("/:taxId", authenticateJWT, authorizeRoles([Role.ADMIN, Role.SUPERADMIN]), updateTaxRule);

router.delete("/:taxId", authenticateJWT, authorizeRoles([Role.SUPERADMIN]), deleteTaxRule);

export default router;
