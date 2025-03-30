"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_1 = require("../middlewares/auth");
var rbac_1 = require("../middlewares/rbac");
var client_1 = require("@prisma/client");
var customerController_1 = require("../controllers/customerController");
var auth_2 = require("../middlewares/auth");
var router = express_1.default.Router({ mergeParams: true });
// Only Admin & Superadmin can create customers
router.post("/", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.SUPERADMIN]), auth_2.validateTenant, customerController_1.createCustomer);
// Only Admin & Manager can view customers
router.get("/", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.MANAGER, client_1.Role.SUPERADMIN]), auth_2.validateTenant, customerController_1.getCustomers);
// Only Superadmin can delete customers
router.delete("/:customerId", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.SUPERADMIN]), auth_2.validateTenant, customerController_1.deleteCustomer);
exports.default = router;
