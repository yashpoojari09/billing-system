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
exports.deleteTaxRule = exports.updateTaxRule = exports.getTaxRules = exports.createTaxRule = void 0;
var client_1 = require("@prisma/client");
var error_1 = require("../middlewares/error");
var prisma = new client_1.PrismaClient();
// CREATE Tax Rule (Admin & Superadmin)
var createTaxRule = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, taxRate, region, tenantId, tax, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                if (!req.user) {
                    next(new error_1.AppError("Unauthorized - User not allowed", 401));
                    return [2 /*return*/];
                }
                _a = req.body, taxRate = _a.taxRate, region = _a.region;
                // 🔹 Ensure required fields are provided
                if (!taxRate || !region) {
                    return [2 /*return*/, next(new error_1.AppError("Tax rate and region are required", 400))];
                }
                tenantId = req.tenant.id;
                // 🔹 Ensure tenantId is available
                if (!tenantId) {
                    return [2 /*return*/, next(new error_1.AppError("Tenant ID is required", 400))];
                }
                return [4 /*yield*/, prisma.taxation.create({ data: { taxRate: taxRate, region: region, tenantId: tenantId } })];
            case 1:
                tax = _b.sent();
                res.status(201).json(tax);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createTaxRule = createTaxRule;
// READ Tax Rules (Admin & Manager)
var getTaxRules = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var tenantId, taxes, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (!req.user) {
                    next(new error_1.AppError("Unauthorized - User not allowed", 401));
                    return [2 /*return*/];
                }
                tenantId = req.tenant.id;
                return [4 /*yield*/, prisma.taxation.findMany({ where: { tenantId: tenantId } })];
            case 1:
                taxes = _a.sent();
                res.json(taxes);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getTaxRules = getTaxRules;
// ✅ Update Tax Rule
var updateTaxRule = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var tenantId, taxId, _a, taxRate, region, tax, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                tenantId = req.tenant.id;
                taxId = req.params.taxId;
                _a = req.body, taxRate = _a.taxRate, region = _a.region;
                if (!taxRate || !region) {
                    return [2 /*return*/, next(new error_1.AppError("Tax rate and region are required for update", 400))];
                }
                return [4 /*yield*/, prisma.taxation.updateMany({
                        where: { id: taxId, tenantId: tenantId }, // Ensures tax rule belongs to the correct tenant
                        data: { taxRate: taxRate, region: region },
                    })];
            case 1:
                tax = _b.sent();
                if (tax.count === 0) {
                    return [2 /*return*/, next(new error_1.AppError("Tax rule not found or you don't have permission", 404))];
                }
                res.status(200).json({ message: "Tax rule updated successfully" });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                next(error_4);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateTaxRule = updateTaxRule;
// DELETE Tax Rule (Superadmin)
var deleteTaxRule = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var tenantId, taxId, taxEntry, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                tenantId = req.tenant.id;
                taxId = req.params.taxId;
                // 🔹 Ensure taxId is provided
                if (!taxId) {
                    return [2 /*return*/, next(new error_1.AppError("Tax ID is required", 400))];
                }
                return [4 /*yield*/, prisma.taxation.findFirst({
                        where: { id: taxId, tenantId: tenantId },
                    })];
            case 1:
                taxEntry = _a.sent();
                if (!taxEntry) {
                    return [2 /*return*/, next(new error_1.AppError("Tax entry not found under this tenant", 404))];
                }
                // ✅ Delete the taxation entry
                return [4 /*yield*/, prisma.taxation.delete({
                        where: { id: taxId, tenantId: tenantId },
                    })];
            case 2:
                // ✅ Delete the taxation entry
                _a.sent();
                res.json({ message: "Tax rule deleted successfully" });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                next(error_5);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteTaxRule = deleteTaxRule;
