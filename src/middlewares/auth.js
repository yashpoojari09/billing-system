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
exports.validateTenant = exports.authenticateJWT = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const error_1 = require("./error");
const passport_1 = __importDefault(require("../config/passport"));
const prisma = new client_1.PrismaClient();
// Middleware to protect routes
const authenticateJWT = (req, res, next) => {
    passport_1.default.authenticate("jwt", { session: false }, (err, user) => {
        if (err || !user) {
            logger_1.default.warn(`Unauthorized access attempt from IP: ${req.ip}`);
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.user = user;
        logger_1.default.info(`User ${user.email} authenticated successfully`);
        next();
    })(req, res, next);
};
exports.authenticateJWT = authenticateJWT;
// Middleware to validate tenant
const validateTenant = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tenantId } = req.params; // Tenant ID from URL params
        if (!tenantId) {
            return next(new error_1.AppError("Tenant ID is required in the URL", 400));
        }
        // Validate if tenant ID is in correct format (UUID)
        const uuidRegex = /^[0-9a-fA-F-]{36}$/;
        if (!uuidRegex.test(tenantId)) {
            return next(new error_1.AppError("Invalid Tenant ID format", 400));
        }
        // Check if tenant exists
        const tenant = yield prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            res.status(404).json({ message: "Tenant not found" });
            return;
        }
        // Attach tenant data to request for further use
        req.tenant = tenant;
        next();
    }
    catch (error) {
        console.error("Error validating tenant:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});
exports.validateTenant = validateTenant;
