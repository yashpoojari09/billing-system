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
exports.forgotPassword = exports.resetPassword = exports.resetToken = exports.logoutUser = exports.refreshAccessToken = exports.updateUser = exports.loginUser = exports.registerUser = void 0;
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
    const resetToken = jsonwebtoken_1.default.sign({ id: userId }, JWT_SECRET, {
        expiresIn: "1h",
    });
    return { accessToken, refreshToken, resetToken };
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
        // 🔹 Store refresh token in DB
        console.log("Generated Refresh Token:", refreshToken);
        const createdToken = yield prisma.refreshToken.create({
            data: { userId: user.id, token: refreshToken },
        });
        console.log("Stored Refresh Token in DB:", createdToken);
        res.json({ message: "Login successful", accessToken, refreshToken, user });
    }
    catch (error) {
        next(error);
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
        const { refreshToken } = req.body;
        if (!refreshToken)
            return next(new error_1.AppError("Refresh token required", 401));
        // 🔹 Check if refresh token exists in DB
        const storedToken = yield prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });
        if (!storedToken)
            return next(new error_1.AppError("Invalid refresh token", 403));
        // 🔹 Verify token
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        if (!decoded)
            return next(new error_1.AppError("Invalid token", 403));
        // 🔹 Generate new access token
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);
        // 🔹 Update refresh token in DB (optional, for better security)
        yield prisma.refreshToken.update({
            where: { token: refreshToken },
            data: { token: newRefreshToken },
        });
        res.json({ accessToken, refreshToken: newRefreshToken });
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
        // 🔹 Delete refresh token from DB
        yield prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
        res.json({ message: "Logged out successfully" });
    }
    catch (error) {
        next(error);
    }
});
exports.logoutUser = logoutUser;
// // Forgot Password Token
// export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
//   const { email } = req.body;
//   if (!email) {
//      res.status(400).json({ error: "Email is required" });
//      return;
//   }
//   try {
//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user)  res.status(404).json({ error: "User not found" })
//     // Generate reset token
//     const resetToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
//     // Store Token in Database
//     await prisma.user.update({
//       where: { email },
//       data: { resetToken },
//     });
//     // Send Email
//     const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
//     await sendResetEmail(email, resetUrl);
//     res.json({ message: "Password reset link sent to your email." });
//   } catch (errorhttp://localhost:3000/) {
//     res.status(500).json({ error: "Something went wrong!" });
//   }
// };
// // Helper Function to Send Email
// const sendResetEmail = async (email: string, resetUrl: string) => {
//   const transporter = nodemailer.createTransport({
//     service: "Gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });
//   await transporter.sendMail({
//     from: `"Billing System" <no-reply@billing.com>`,
//     to: email,
//     subject: "Password Reset Request",
//     html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
//   });
// };
// ✅ GET Controller - Verify Reset Token
// ✅ Verify Reset Token
// ✅ GET Controller - Verify Reset Token
const resetToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.params; // Extract token from URL
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Check if user exists
        const user = yield prisma.user.findUnique({
            where: { email: decoded.email },
        });
        if (!user || user.resetToken !== token) {
            res.status(400).json({ message: "Invalid or expired token." });
            return;
        }
        res.status(200).json({ message: "Valid token." });
    }
    catch (error) {
        res.status(400).json({ message: "Invalid or expired token." });
    }
});
exports.resetToken = resetToken;
// ✅ POST Controller - Reset Password
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token: resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
        res.status(400).json({ error: "Token and new password are required." });
        return;
    }
    try {
        // Verify the token
        const decoded = jsonwebtoken_1.default.verify(resetToken, JWT_SECRET);
        // Find user by email
        const user = yield prisma.user.findUnique({ where: { email: decoded.email } });
        if (!user || user.resetToken !== resetToken) {
            res.status(400).json({ error: "Invalid or expired token." });
            return;
        }
        // Hash new password
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        // Update password and clear reset token
        yield prisma.user.update({
            where: { email: user.email },
            data: { password: hashedPassword, resetToken: null }, // Clear resetToken
        });
        res.status(200).json({ message: "Password reset successful. Redirecting to login..." });
    }
    catch (error) {
        res.status(500).json({ error: "Something went wrong. Try again." });
    }
});
exports.resetPassword = resetPassword;
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
        // Check if user exists
        const user = yield prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Generate a reset token (JWT)
        const resetToken = jsonwebtoken_1.default.sign({ email }, JWT_SECRET, {
            expiresIn: "1h", // The token expires in 1 hour
        });
        // Send the reset link to the user's email
        const resetLink = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;
        yield transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset",
            html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
        });
        return res.status(200).json({ message: "Password reset link sent to email." });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong." });
    }
});
exports.forgotPassword = forgotPassword;
//# sourceMappingURL=authController.js.map