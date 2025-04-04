import express from "express";
import { authenticateJWT } from "../middlewares/auth";
import { authorizeRoles } from "../middlewares/rbac";
import { Role } from "@prisma/client";
import { createCustomer, getCustomers, deleteCustomer, updateCustomer, getCustomerById, emailHandler } from "../controllers/customerController";
import { validateTenant } from "../middlewares/auth";

const router = express.Router({ mergeParams: true });

// Only Admin & Superadmin can create customers
router.post("/", authenticateJWT, authorizeRoles([Role.ADMIN, Role.SUPERADMIN]), validateTenant, createCustomer);

// Only Admin & Manager can view customers
router.get("/", authenticateJWT, authorizeRoles([Role.ADMIN, Role.MANAGER, Role.SUPERADMIN]),validateTenant, getCustomers);

// Only Superadmin can delete customers
router.delete("/:customerId", authenticateJWT, authorizeRoles([Role.ADMIN, Role.SUPERADMIN]),validateTenant, deleteCustomer);

router.get(
    "/:customerId",
    authenticateJWT,
    authorizeRoles([Role.ADMIN, Role.SUPERADMIN]),
    validateTenant,
    getCustomerById
  );


router.put(
  "/:customerId",
  authenticateJWT,
  authorizeRoles([Role.ADMIN, Role.SUPERADMIN]),
  validateTenant,
  updateCustomer
);

router.get("/", authenticateJWT, authorizeRoles([Role.ADMIN, Role.MANAGER, Role.SUPERADMIN]),validateTenant, emailHandler);


export default router;
