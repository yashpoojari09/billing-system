"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
router.post("/register", authController_1.registerUser);
router.post("/login", authController_1.loginUser);
router.post("/refresh", authController_1.refreshAccessToken);
router.post("/logout", authController_1.logoutUser);
router.post("/forgot-password", authController_1.forgotPassword);
router.get("/reset-password", authController_1.resetToken);
router.post("/reset-password", authController_1.resetPassword);
// Protected Routes
router.put("/:id", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.SUPERADMIN]), authController_1.updateUser);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map