"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_1 = require("../middlewares/auth");
var rbac_1 = require("../middlewares/rbac");
var client_1 = require("@prisma/client");
var taxationController_1 = require("../controllers/taxationController");
var router = express_1.default.Router();
router.post("/", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.SUPERADMIN]), taxationController_1.createTaxRule);
router.get("/", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.MANAGER, client_1.Role.SUPERADMIN]), taxationController_1.getTaxRules);
// Only Admin & Superadmin can update tax rules
router.put("/:taxId", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.SUPERADMIN]), taxationController_1.updateTaxRule);
router.delete("/:taxId", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.SUPERADMIN]), taxationController_1.deleteTaxRule);
exports.default = router;
