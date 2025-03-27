"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const client_1 = require("@prisma/client");
const customerController_1 = require("../controllers/customerController");
const auth_2 = require("../middlewares/auth");
const router = express_1.default.Router({ mergeParams: true });
// Only Admin & Superadmin can create customers
router.post("/", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.SUPERADMIN]), auth_2.validateTenant, customerController_1.createCustomer);
// Only Admin & Manager can view customers
router.get("/", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.MANAGER, client_1.Role.SUPERADMIN]), auth_2.validateTenant, customerController_1.getCustomers);
// Only Superadmin can delete customers
router.delete("/:customerId", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.SUPERADMIN]), auth_2.validateTenant, customerController_1.deleteCustomer);
exports.default = router;
//# sourceMappingURL=customers.js.map