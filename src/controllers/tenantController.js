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
exports.deleteTenant = exports.updateTenant = exports.getTenantById = exports.getAllTenants = exports.createTenant = void 0;
var client_1 = require("@prisma/client");
var error_1 = require("../middlewares/error");
var prisma = new client_1.PrismaClient();
// CREATE Tenant (Only Superadmin)
var createTenant = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, category, existingTenant, tenant, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, name_1 = _a.name, category = _a.category;
                if (!name_1 || !category) {
                    return [2 /*return*/, next(new error_1.AppError("Name and category are required", 400))];
                }
                return [4 /*yield*/, prisma.tenant.findUnique({ where: { name: name_1 } })];
            case 1:
                existingTenant = _b.sent();
                if (existingTenant) {
                    return [2 /*return*/, next(new error_1.AppError("Tenant with this name already exists", 400))];
                }
                return [4 /*yield*/, prisma.tenant.create({
                        data: { name: name_1, category: category },
                    })];
            case 2:
                tenant = _b.sent();
                res.status(201).json(tenant);
                return [3 /*break*/, 4];
            case 3:
                error_2 = _b.sent();
                next(error_2);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.createTenant = createTenant;
// GET All Tenants (Superadmin Only)
var getAllTenants = function (_req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var tenants, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma.tenant.findMany()];
            case 1:
                tenants = _a.sent();
                res.json(tenants);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAllTenants = getAllTenants;
// GET Tenant By ID (Admin & Superadmin)
var getTenantById = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var tenantId, tenant, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                tenantId = req.tenant.id;
                return [4 /*yield*/, prisma.tenant.findUnique({ where: { id: tenantId } })];
            case 1:
                tenant = _a.sent();
                if (!tenantId) {
                    return [2 /*return*/, next(new error_1.AppError("Tenant not found", 404))];
                }
                res.json(tenant);
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                next(error_4);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getTenantById = getTenantById;
// UPDATE Tenant (Admin & Superadmin)
var updateTenant = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var tenantId, _a, name_2, category, tenant, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                tenantId = req.tenant.id;
                _a = req.body, name_2 = _a.name, category = _a.category;
                return [4 /*yield*/, prisma.tenant.update({
                        where: { id: tenantId },
                        data: { name: name_2, category: category },
                    })];
            case 1:
                tenant = _b.sent();
                res.json(tenant);
                return [3 /*break*/, 3];
            case 2:
                error_5 = _b.sent();
                next(error_5);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateTenant = updateTenant;
// DELETE Tenant (Only Superadmin)
var deleteTenant = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var tenantId, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                tenantId = req.tenant.id;
                return [4 /*yield*/, prisma.tenant.delete({ where: { id: tenantId } })];
            case 1:
                _a.sent();
                res.json({ message: "Tenant deleted successfully" });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                next(error_6);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteTenant = deleteTenant;
// Tenant
