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
exports.logoutUser = exports.refreshAccessToken = exports.updateUser = exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const error_1 = require("../middlewares/error");
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
            return next(new error_1.AppError("Invalid credentials", 401));
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
//# sourceMappingURL=authController.js.map