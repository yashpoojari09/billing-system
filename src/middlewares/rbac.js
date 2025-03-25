"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = void 0;
// ✅ Middleware to check user role
const authorizeRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized- User not available" });
            return; // 🔹 Ensure execution stops
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: "Forbidden: Access denied" });
            return; // 🔹 Ensure execution stops
        }
        next(); // ✅ If user is authorized, continue execution
    };
};
exports.authorizeRoles = authorizeRoles;
