"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_1 = require("../middlewares/auth");
var rbac_1 = require("../middlewares/rbac");
var client_1 = require("@prisma/client");
var inventoryController_1 = require("../controllers/inventoryController");
var auth_2 = require("../middlewares/auth");
var router = express_1.default.Router({ mergeParams: true });
// ✅ Create Inventory (Only Admin & Superadmin)
router.post("/", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.SUPERADMIN]), auth_2.validateTenant, inventoryController_1.createInventoryItem);
// ✅ Get Inventory List (Admin, Manager, Superadmin)
router.get("/", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.MANAGER, client_1.Role.SUPERADMIN]), auth_2.validateTenant, inventoryController_1.getInventory);
// ✅ Update Inventory Item (Only Admin & Superadmin)
router.put("/:inventoryId", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.SUPERADMIN]), auth_2.validateTenant, inventoryController_1.updateInventoryItem);
// ✅ Delete Inventory Item (Only Superadmin)
router.delete("/:inventoryId", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.SUPERADMIN]), auth_2.validateTenant, inventoryController_1.deleteInventoryItem);
exports.default = router;
