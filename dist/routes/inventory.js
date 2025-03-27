"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const client_1 = require("@prisma/client");
const inventoryController_1 = require("../controllers/inventoryController");
const auth_2 = require("../middlewares/auth");
const router = express_1.default.Router({ mergeParams: true });
// ✅ Create Inventory (Only Admin & Superadmin)
router.post("/", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.SUPERADMIN]), auth_2.validateTenant, inventoryController_1.createInventoryItem);
// ✅ Get Inventory List (Admin, Manager, Superadmin)
router.get("/", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.MANAGER, client_1.Role.SUPERADMIN]), auth_2.validateTenant, inventoryController_1.getInventory);
// ✅ Update Inventory Item (Only Admin & Superadmin)
router.put("/:inventoryId", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.SUPERADMIN]), auth_2.validateTenant, inventoryController_1.updateInventoryItem);
// ✅ Delete Inventory Item (Only Superadmin)
router.delete("/:inventoryId", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.SUPERADMIN]), auth_2.validateTenant, inventoryController_1.deleteInventoryItem);
exports.default = router;
//# sourceMappingURL=inventory.js.map