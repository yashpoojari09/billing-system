"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const client_1 = require("@prisma/client");
const taxationController_1 = require("../controllers/taxationController");
const router = express_1.default.Router();
router.post("/", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.SUPERADMIN]), taxationController_1.createTaxRule);
router.get("/", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.MANAGER, client_1.Role.SUPERADMIN]), taxationController_1.getTaxRules);
// Only Admin & Superadmin can update tax rules
router.put("/:taxId", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.SUPERADMIN]), taxationController_1.updateTaxRule);
router.delete("/:taxId", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.SUPERADMIN]), taxationController_1.deleteTaxRule);
exports.default = router;
