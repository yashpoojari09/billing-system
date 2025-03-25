import express from "express";
import { registerUser, loginUser, refreshAccessToken, logoutUser, updateUser } from "../controllers/authController";
import { authenticateJWT } from "../middlewares/auth";
import { authorizeRoles } from "../middlewares/rbac";
import { Role } from "@prisma/client";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

// Protected Routes
router.put("/:id", authenticateJWT , authorizeRoles([Role.SUPERADMIN]), updateUser);


export default router;
