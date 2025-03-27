import express from "express";
import { registerUser, loginUser, refreshAccessToken, logoutUser, updateUser, forgotPassword, resetPassword } from "../controllers/authController";
import { authenticateJWT } from "../middlewares/auth";
import { authorizeRoles } from "../middlewares/rbac";
import { Role } from "@prisma/client";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword)
router.post("/reset-password", resetPassword);
// Protected Routes
router.put("/:id", authenticateJWT , authorizeRoles([Role.SUPERADMIN]), updateUser);


export default router;
