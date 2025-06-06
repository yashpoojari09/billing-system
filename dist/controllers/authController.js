"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.resetToken = exports.forgotPassword = exports.logoutUser = exports.refreshAccessToken = exports.updateUser = exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const error_1 = require("../middlewares/error");
const nodemailer_1 = __importDefault(require("nodemailer"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // Use env variable
const REFRESH_SECRET = process.env.REFRESH_SECRET || "your_refresh_secret";
const ACCESS_TOKEN_EXPIRY = "6h"; // Short-lived token
const REFRESH_TOKEN_EXPIRY = "1d"; // Long-lived token
// ✅ Function to generate tokens
const generateTokens = (userId) => {
    const accessToken = jsonwebtoken_1.default.sign({ id: userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jsonwebtoken_1.default.sign({ id: userId }, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
    return { accessToken, refreshToken };
};
// ✅ REGISTER USER
const registerUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, role, tenantId } = req.body;
        // 🔹 Check if user already exists
        const existingUser = yield prisma.user.findUnique({ where: { email } });
        if (existingUser)
            return next(new error_1.AppError("User already exists", 400));
        // 🔹 Hash password
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // 🔹 Create new user
        const user = yield prisma.user.create({
            data: { name, email, password: hashedPassword, role, tenantId },
        });
        res.status(201).json({ message: "User registered successfully", user });
    }
    catch (error) {
        next(error);
    }
});
exports.registerUser = registerUser;
// ✅ LOGIN USER
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // 🔹 Find user by email
        const user = yield prisma.user.findUnique({ where: { email } });
        if (!user)
            return next(new error_1.AppError("Invalid Email Id", 401));
        // 🔹 Compare password
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch)
            return next(new error_1.AppError("Invalid credentials", 401));
        // 🔹 Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id);
        // 🔹 Delete old refresh tokens for this user
        yield prisma.refreshToken.deleteMany({ where: { userId: user.id } });
        // 🔹 Store new refresh token in DB
        yield prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken } });
        // 🔹 Set refresh token in an HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax", // Prevents CSRF
            path: "/auth/refresh",
        });
        // Remove misplaced response handling code
        res.json({ message: "Login successful", accessToken, user });
    }
    catch (error) {
        console.error("Login error:", error);
    }
});
exports.loginUser = loginUser;
// ✅ UPDATE USER (Only Admin & Superadmin)
const updateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, email, password, role, tenantId } = req.body;
        // 🔹 Check if user exists
        const user = yield prisma.user.findUnique({ where: { id } });
        if (!user)
            return next(new error_1.AppError("User not found", 404));
        // 🔹 Check if tenant exists (if updating tenant)
        if (tenantId) {
            const tenant = yield prisma.tenant.findUnique({ where: { id: tenantId } });
            if (!tenant)
                return next(new error_1.AppError("Tenant not found", 404));
        }
        // 🔹 Hash new password if provided
        const updatedData = { name, email, role, tenantId };
        if (password) {
            updatedData.password = yield bcrypt_1.default.hash(password, 10);
        }
        // 🔹 Update user
        const updatedUser = yield prisma.user.update({ where: { id }, data: updatedData });
        res.json({ message: "User updated successfully", updatedUser });
    }
    catch (error) {
        next(error);
    }
});
exports.updateUser = updateUser;
// Refresh Token
const refreshAccessToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken)
            return next(new error_1.AppError("Refresh token required", 401));
        // 🔹 Check if refresh token exists in DB
        const storedToken = yield prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });
        if (!storedToken) {
            res.clearCookie("refreshToken", { path: "/auth/refresh" });
            return next(new error_1.AppError("Invalid refresh token", 403));
        }
        // 🔹 Verify token
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_SECRET);
        }
        catch (err) {
            res.clearCookie("refreshToken", { path: "/auth/refresh" });
            return next(new error_1.AppError("Invalid or expired refresh token", 403));
        }
        // 🔹 Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);
        // 🔹 Remove old refresh token and store the new one
        yield prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
        yield prisma.refreshToken.create({ data: { userId: decoded.id, token: newRefreshToken } });
        // 🔹 Set new refresh token in HTTP-only cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true, // Only send over HTTPS
            sameSite: "strict",
            path: "/",
            maxAge: 24 * 60 * 60 * 1000,
        });
        res.json({ accessToken });
    }
    catch (error) {
        next(error);
    }
});
exports.refreshAccessToken = refreshAccessToken;
// ✅ LOGOUT USER (Revoke Refresh Token)
const logoutUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return next(new error_1.AppError("Refresh token is required", 400));
        yield prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
        res.clearCookie("refreshToken", { path: "/auth/refresh" });
        res.json({ message: "Logged out successfully" });
    }
    catch (error) {
        next(error);
    }
});
exports.logoutUser = logoutUser;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const transporter = nodemailer_1.default.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER, // Your email (e.g., Gmail)
        pass: process.env.EMAIL_PASS, // Your email password or App Password
    },
});
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const user = yield prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Generate a reset token
        const resetToken = jsonwebtoken_1.default.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
        // Hash the token for security
        const hashedToken = yield bcrypt_1.default.hash(resetToken, 10);
        // Store the token and expiration in DB
        yield prisma.user.update({
            where: { email },
            data: {
                resetToken: hashedToken,
                resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
            },
        });
        // Send the reset link via email
        const resetLink = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;
        yield transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset",
            html: `<p>Click the link below to reset your password:</p>
            <a href="${resetLink}">${resetLink}</a>`,
        });
        return res.status(200).json({ message: "Password reset link sent to email." });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong." });
    }
});
exports.forgotPassword = forgotPassword;
// get Reset Token
const resetToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
        res.status(400).json({ message: "Token is missing or invalid." });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded || typeof decoded !== "object" || !decoded.email) {
            res.status(400).json({ message: "Invalid or expired token." });
            return;
        }
        const user = yield prisma.user.findUnique({
            where: { email: decoded.email },
        });
        if (!user || !user.resetToken || !user.resetTokenExpiry) {
            res.status(400).json({ message: "Invalid or expired token." });
            return;
        }
        // Compare hashed token
        const isMatch = yield bcrypt_1.default.compare(token, user.resetToken);
        if (!isMatch || new Date() > user.resetTokenExpiry) {
            res.status(400).json({ message: "Invalid or expired token." });
            return;
        }
        res.status(200).json({ message: "Valid token." });
        return;
    }
    catch (error) {
        console.error("JWT Verification Error:", error);
        res.status(400).json({ message: "Invalid or expired token." });
        return;
    }
});
exports.resetToken = resetToken;
/// ✅ POST Controller - Reset Password
const resetPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        if (!token || !newPassword || !confirmPassword) {
            return next(new error_1.AppError("Token and new password are required.", 400));
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (error) {
            return next(new error_1.AppError("Invalid or expired token. Please request a new reset link.", 400));
        }
        const user = yield prisma.user.findUnique({ where: { email: decoded.email } });
        if (!user) {
            return next(new error_1.AppError("User not found.", 404));
        }
        console.log("User details:", user);
        const isTokenValid = user.resetToken && (yield bcrypt_1.default.compare(token, user.resetToken));
        if (!user.resetToken || !isTokenValid) {
            return next(new error_1.AppError("Invalid or expired token. Please request a new reset link.", 400));
        }
        // ✅ Fix: Check if the token is expired
        if (user.resetTokenExpiry && new Date(user.resetTokenExpiry) < new Date()) {
            return next(new error_1.AppError("Reset token has expired. Please request a new one.", 400));
        }
        if (newPassword !== confirmPassword) {
            return next(new error_1.AppError("New password and confirm password do not match.", 400));
        }
        if (newPassword.length < 8) {
            return next(new error_1.AppError("Password must be at least 8 characters long.", 400));
        }
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        yield prisma.user.update({
            where: { email: decoded.email },
            data: { password: hashedPassword, resetToken: null },
        });
        // ✅ **Fix: Add return to stop execution after success**
        return res.status(200).json({ success: true, message: "Password reset successful. Redirecting to login..." });
    }
    catch (error) {
        return next(error);
    }
});
exports.resetPassword = resetPassword;
//# sourceMappingURL=authController.js.map