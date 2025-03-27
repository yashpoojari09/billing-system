"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const auth_2 = require("../middlewares/auth");
const client_1 = require("@prisma/client");
const tenantController_1 = require("../controllers/tenantController");
const customers_1 = __importDefault(require("./customers"));
const inventory_1 = __importDefault(require("./inventory"));
const taxation_1 = __importDefault(require("./taxation"));
const router = express_1.default.Router();
// Only Superadmin can create tenants
router.post("/", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.SUPERADMIN]), tenantController_1.createTenant);
// Only Superadmin can view all tenants
router.get("/", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.SUPERADMIN]), tenantController_1.getAllTenants);
// Admin & Superadmin can view their own tenant details
router.get("/:tenantId", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.SUPERADMIN]), auth_2.validateTenant, tenantController_1.getTenantById);
// Admin & Superadmin can update tenant details
router.put("/:tenantId", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.SUPERADMIN]), auth_2.validateTenant, tenantController_1.updateTenant);
// Only Superadmin can delete tenants
router.delete("/:tenantId", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.SUPERADMIN]), auth_2.validateTenant, tenantController_1.deleteTenant);
// ✅ Nested route for customers under a tenant
router.use("/:tenantId/customers", auth_2.validateTenant, customers_1.default);
// ✅ Nested route for customers under a tenant
router.use("/:tenantId/inventory", auth_2.validateTenant, inventory_1.default);
// ✅ Nested route for customers under a tenant
router.use("/:tenantId/taxation", auth_2.validateTenant, taxation_1.default);
exports.default = router;
//# sourceMappingURL=tenants.js.map