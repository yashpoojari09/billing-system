"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var authController_1 = require("../controllers/authController");
var auth_1 = require("../middlewares/auth");
var rbac_1 = require("../middlewares/rbac");
var client_1 = require("@prisma/client");
var cookie_parser_1 = require("cookie-parser");
var router = express_1.default.Router();
router.use((0, cookie_parser_1.default)());
router.post("/register", authController_1.registerUser);
router.post("/login", authController_1.loginUser);
router.post("/refresh", authController_1.refreshAccessToken);
router.post("/logout", authController_1.logoutUser);
router.post("/forgot-password", authController_1.forgotPassword);
router.get("/reset-password/", authController_1.resetToken);
router.post("/reset-password", authController_1.resetPassword);
// Protected Routes
router.put("/:id", auth_1.authenticateJWT, (0, rbac_1.authorizeRoles)([client_1.Role.SUPERADMIN]), authController_1.updateUser);
exports.default = router;
