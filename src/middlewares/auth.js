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
exports.validateTenant = exports.authenticateJWT = void 0;
var client_1 = require("@prisma/client");
var logger_1 = require("../utils/logger");
var error_1 = require("./error");
var passport_1 = require("../config/passport");
var prisma = new client_1.PrismaClient();
// Middleware to protect routes
var authenticateJWT = function (req, res, next) {
    passport_1.default.authenticate("jwt", { session: false }, function (err, user) {
        if (err || !user) {
            logger_1.default.warn("Unauthorized access attempt from IP: ".concat(req.ip));
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.user = user;
        logger_1.default.info("User ".concat(user.email, " authenticated successfully"));
        return next();
    })(req, res, next);
};
exports.authenticateJWT = authenticateJWT;
// Middleware to validate tenant
var validateTenant = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var tenantId, uuidRegex, tenant, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                tenantId = req.params.tenantId;
                if (!tenantId) {
                    return [2 /*return*/, next(new error_1.AppError("Tenant ID is required in the URL", 400))];
                }
                uuidRegex = /^[0-9a-fA-F-]{36}$/;
                if (!uuidRegex.test(tenantId)) {
                    return [2 /*return*/, next(new error_1.AppError("Invalid Tenant ID format", 400))];
                }
                return [4 /*yield*/, prisma.tenant.findUnique({
                        where: { id: tenantId },
                    })];
            case 1:
                tenant = _a.sent();
                if (!tenant) {
                    res.status(404).json({ message: "Tenant not found" });
                    return [2 /*return*/];
                }
                // Attach tenant data to request for further use
                req.tenant = tenant;
                next();
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error("Error validating tenant:", error_2);
                res.status(500).json({ message: "Internal server error" });
                return [2 /*return*/];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.validateTenant = validateTenant;
