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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.resetToken = exports.forgotPassword = exports.logoutUser = exports.refreshAccessToken = exports.updateUser = exports.loginUser = exports.registerUser = void 0;
var bcrypt_1 = require("bcrypt");
var jsonwebtoken_1 = require("jsonwebtoken");
var client_1 = require("@prisma/client");
var error_1 = require("../middlewares/error");
var nodemailer_1 = require("nodemailer");
var prisma = new client_1.PrismaClient();
var JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // Use env variable
var REFRESH_SECRET = process.env.REFRESH_SECRET || "your_refresh_secret";
var ACCESS_TOKEN_EXPIRY = "6h"; // Short-lived token
var REFRESH_TOKEN_EXPIRY = "1d"; // Long-lived token
// ✅ Function to generate tokens
var generateTokens = function (userId) {
    var accessToken = jsonwebtoken_1.default.sign({ id: userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    var refreshToken = jsonwebtoken_1.default.sign({ id: userId }, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
    return { accessToken: accessToken, refreshToken: refreshToken };
};
// ✅ REGISTER USER
var registerUser = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, email, password, role, tenantId, existingUser, hashedPassword, user, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = req.body, name_1 = _a.name, email = _a.email, password = _a.password, role = _a.role, tenantId = _a.tenantId;
                return [4 /*yield*/, prisma.user.findUnique({ where: { email: email } })];
            case 1:
                existingUser = _b.sent();
                if (existingUser)
                    return [2 /*return*/, next(new error_1.AppError("User already exists", 400))];
                return [4 /*yield*/, bcrypt_1.default.hash(password, 10)];
            case 2:
                hashedPassword = _b.sent();
                return [4 /*yield*/, prisma.user.create({
                        data: { name: name_1, email: email, password: hashedPassword, role: role, tenantId: tenantId },
                    })];
            case 3:
                user = _b.sent();
                res.status(201).json({ message: "User registered successfully", user: user });
                return [3 /*break*/, 5];
            case 4:
                error_2 = _b.sent();
                next(error_2);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.registerUser = registerUser;
// ✅ LOGIN USER
var loginUser = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, user, isMatch, _b, accessToken, refreshToken, error_3;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 5, , 6]);
                _a = req.body, email = _a.email, password = _a.password;
                return [4 /*yield*/, prisma.user.findUnique({ where: { email: email } })];
            case 1:
                user = _c.sent();
                if (!user)
                    return [2 /*return*/, next(new error_1.AppError("Invalid Email Id", 401))];
                return [4 /*yield*/, bcrypt_1.default.compare(password, user.password)];
            case 2:
                isMatch = _c.sent();
                if (!isMatch)
                    return [2 /*return*/, next(new error_1.AppError("Invalid credentials", 401))];
                _b = generateTokens(user.id), accessToken = _b.accessToken, refreshToken = _b.refreshToken;
                // 🔹 Delete old refresh tokens for this user
                return [4 /*yield*/, prisma.refreshToken.deleteMany({ where: { userId: user.id } })];
            case 3:
                // 🔹 Delete old refresh tokens for this user
                _c.sent();
                // 🔹 Store new refresh token in DB
                return [4 /*yield*/, prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken } })];
            case 4:
                // 🔹 Store new refresh token in DB
                _c.sent();
                // 🔹 Set refresh token in an HTTP-only cookie
                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "lax", // Prevents CSRF
                    path: "/auth/refresh",
                });
                res.json({ message: "Login successful", accessToken: accessToken, user: user });
                return [3 /*break*/, 6];
            case 5:
                error_3 = _c.sent();
                next(error_3);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.loginUser = loginUser;
// ✅ UPDATE USER (Only Admin & Superadmin)
var updateUser = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, name_2, email, password, role, tenantId, user, tenant, updatedData, _b, updatedUser, error_4;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 7, , 8]);
                id = req.params.id;
                _a = req.body, name_2 = _a.name, email = _a.email, password = _a.password, role = _a.role, tenantId = _a.tenantId;
                return [4 /*yield*/, prisma.user.findUnique({ where: { id: id } })];
            case 1:
                user = _c.sent();
                if (!user)
                    return [2 /*return*/, next(new error_1.AppError("User not found", 404))];
                if (!tenantId) return [3 /*break*/, 3];
                return [4 /*yield*/, prisma.tenant.findUnique({ where: { id: tenantId } })];
            case 2:
                tenant = _c.sent();
                if (!tenant)
                    return [2 /*return*/, next(new error_1.AppError("Tenant not found", 404))];
                _c.label = 3;
            case 3:
                updatedData = { name: name_2, email: email, role: role, tenantId: tenantId };
                if (!password) return [3 /*break*/, 5];
                _b = updatedData;
                return [4 /*yield*/, bcrypt_1.default.hash(password, 10)];
            case 4:
                _b.password = _c.sent();
                _c.label = 5;
            case 5: return [4 /*yield*/, prisma.user.update({ where: { id: id }, data: updatedData })];
            case 6:
                updatedUser = _c.sent();
                res.json({ message: "User updated successfully", updatedUser: updatedUser });
                return [3 /*break*/, 8];
            case 7:
                error_4 = _c.sent();
                next(error_4);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.updateUser = updateUser;
// Refresh Token
var refreshAccessToken = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var refreshToken, storedToken, decoded, _a, accessToken, newRefreshToken, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                refreshToken = req.cookies.refreshToken;
                if (!refreshToken)
                    return [2 /*return*/, next(new error_1.AppError("Refresh token required", 401))];
                return [4 /*yield*/, prisma.refreshToken.findUnique({
                        where: { token: refreshToken },
                    })];
            case 1:
                storedToken = _b.sent();
                if (!storedToken) {
                    res.clearCookie("refreshToken", { path: "/auth/refresh" });
                    return [2 /*return*/, next(new error_1.AppError("Invalid refresh token", 403))];
                }
                decoded = void 0;
                try {
                    decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_SECRET);
                }
                catch (err) {
                    res.clearCookie("refreshToken", { path: "/auth/refresh" });
                    return [2 /*return*/, next(new error_1.AppError("Invalid or expired refresh token", 403))];
                }
                _a = generateTokens(decoded.id), accessToken = _a.accessToken, newRefreshToken = _a.refreshToken;
                // 🔹 Remove old refresh token and store the new one
                return [4 /*yield*/, prisma.refreshToken.deleteMany({ where: { token: refreshToken } })];
            case 2:
                // 🔹 Remove old refresh token and store the new one
                _b.sent();
                return [4 /*yield*/, prisma.refreshToken.create({ data: { userId: decoded.id, token: newRefreshToken } })];
            case 3:
                _b.sent();
                // 🔹 Set new refresh token in HTTP-only cookie
                res.cookie("refreshToken", newRefreshToken, {
                    httpOnly: true,
                    secure: true, // Only send over HTTPS
                    sameSite: "strict",
                    path: "/auth/refresh",
                });
                res.json({ accessToken: accessToken });
                return [3 /*break*/, 5];
            case 4:
                error_5 = _b.sent();
                next(error_5);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.refreshAccessToken = refreshAccessToken;
// ✅ LOGOUT USER (Revoke Refresh Token)
var logoutUser = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var refreshToken, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                refreshToken = req.body.refreshToken;
                if (!refreshToken)
                    return [2 /*return*/, next(new error_1.AppError("Refresh token is required", 400))];
                return [4 /*yield*/, prisma.refreshToken.deleteMany({ where: { token: refreshToken } })];
            case 1:
                _a.sent();
                res.clearCookie("refreshToken", { path: "/auth/refresh" });
                res.json({ message: "Logged out successfully" });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                next(error_6);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.logoutUser = logoutUser;
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var transporter = nodemailer_1.default.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER, // Your email (e.g., Gmail)
        pass: process.env.EMAIL_PASS, // Your email password or App Password
    },
});
var forgotPassword = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var email, user, resetToken_1, hashedToken, resetLink, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                email = req.body.email;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 6, , 7]);
                return [4 /*yield*/, prisma.user.findUnique({ where: { email: email } })];
            case 2:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                }
                resetToken_1 = jsonwebtoken_1.default.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: "1h" });
                return [4 /*yield*/, bcrypt_1.default.hash(resetToken_1, 10)];
            case 3:
                hashedToken = _a.sent();
                // Store the token and expiration in DB
                return [4 /*yield*/, prisma.user.update({
                        where: { email: email },
                        data: {
                            resetToken: hashedToken,
                            resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
                        },
                    })];
            case 4:
                // Store the token and expiration in DB
                _a.sent();
                resetLink = "".concat(process.env.CLIENT_URL, "/auth/reset-password?token=").concat(resetToken_1);
                return [4 /*yield*/, transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: email,
                        subject: "Password Reset",
                        html: "<p>Click the link below to reset your password:</p>\n            <a href=\"".concat(resetLink, "\">").concat(resetLink, "</a>"),
                    })];
            case 5:
                _a.sent();
                return [2 /*return*/, res.status(200).json({ message: "Password reset link sent to email." })];
            case 6:
                error_7 = _a.sent();
                console.error(error_7);
                return [2 /*return*/, res.status(500).json({ message: "Something went wrong." })];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.forgotPassword = forgotPassword;
// get Reset Token
var resetToken = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token, decoded, user, isMatch, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                token = req.query.token;
                if (!token || typeof token !== "string") {
                    res.status(400).json({ message: "Token is missing or invalid." });
                    return [2 /*return*/];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                if (!decoded || typeof decoded !== "object" || !decoded.email) {
                    res.status(400).json({ message: "Invalid or expired token." });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, prisma.user.findUnique({
                        where: { email: decoded.email },
                    })];
            case 2:
                user = _a.sent();
                if (!user || !user.resetToken || !user.resetTokenExpiry) {
                    res.status(400).json({ message: "Invalid or expired token." });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, bcrypt_1.default.compare(token, user.resetToken)];
            case 3:
                isMatch = _a.sent();
                if (!isMatch || new Date() > user.resetTokenExpiry) {
                    res.status(400).json({ message: "Invalid or expired token." });
                    return [2 /*return*/];
                }
                res.status(200).json({ message: "Valid token." });
                return [2 /*return*/];
            case 4:
                error_8 = _a.sent();
                console.error("JWT Verification Error:", error_8);
                res.status(400).json({ message: "Invalid or expired token." });
                return [2 /*return*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.resetToken = resetToken;
/// ✅ POST Controller - Reset Password
var resetPassword = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, token, newPassword, confirmPassword, decoded, user, isTokenValid, _b, hashedPassword, error_9;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 6, , 7]);
                _a = req.body, token = _a.token, newPassword = _a.newPassword, confirmPassword = _a.confirmPassword;
                if (!token || !newPassword || !confirmPassword) {
                    return [2 /*return*/, next(new error_1.AppError("Token and new password are required.", 400))];
                }
                decoded = void 0;
                try {
                    decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                }
                catch (error) {
                    return [2 /*return*/, next(new error_1.AppError("Invalid or expired token. Please request a new reset link.", 400))];
                }
                return [4 /*yield*/, prisma.user.findUnique({ where: { email: decoded.email } })];
            case 1:
                user = _c.sent();
                if (!user) {
                    return [2 /*return*/, next(new error_1.AppError("User not found.", 404))];
                }
                console.log("User details:", user);
                _b = user.resetToken;
                if (!_b) return [3 /*break*/, 3];
                return [4 /*yield*/, bcrypt_1.default.compare(token, user.resetToken)];
            case 2:
                _b = (_c.sent());
                _c.label = 3;
            case 3:
                isTokenValid = _b;
                if (!user.resetToken || !isTokenValid) {
                    return [2 /*return*/, next(new error_1.AppError("Invalid or expired token. Please request a new reset link.", 400))];
                }
                // ✅ Fix: Check if the token is expired
                if (user.resetTokenExpiry && new Date(user.resetTokenExpiry) < new Date()) {
                    return [2 /*return*/, next(new error_1.AppError("Reset token has expired. Please request a new one.", 400))];
                }
                if (newPassword !== confirmPassword) {
                    return [2 /*return*/, next(new error_1.AppError("New password and confirm password do not match.", 400))];
                }
                if (newPassword.length < 8) {
                    return [2 /*return*/, next(new error_1.AppError("Password must be at least 8 characters long.", 400))];
                }
                return [4 /*yield*/, bcrypt_1.default.hash(newPassword, 10)];
            case 4:
                hashedPassword = _c.sent();
                return [4 /*yield*/, prisma.user.update({
                        where: { email: decoded.email },
                        data: { password: hashedPassword, resetToken: null },
                    })];
            case 5:
                _c.sent();
                // ✅ **Fix: Add return to stop execution after success**
                return [2 /*return*/, res.status(200).json({ success: true, message: "Password reset successful. Redirecting to login..." })];
            case 6:
                error_9 = _c.sent();
                return [2 /*return*/, next(error_9)];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.resetPassword = resetPassword;
