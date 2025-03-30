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
exports.deleteCustomer = exports.getCustomers = exports.createCustomer = void 0;
var client_1 = require("@prisma/client");
var error_1 = require("../middlewares/error");
var prisma = new client_1.PrismaClient();
// CREATE Customer (Only Admin & Superadmin)
var createCustomer = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, email, tenantId, customer, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                if (!req.user) {
                    return [2 /*return*/, next(new error_1.AppError("Unauthorized - User not available", 401))];
                }
                _a = req.body, name_1 = _a.name, email = _a.email;
                tenantId = req.tenant.id;
                if (!name_1 || !email) {
                    return [2 /*return*/, next(new error_1.AppError("Name and email are required", 400))];
                }
                return [4 /*yield*/, prisma.customer.create({
                        data: {
                            name: name_1,
                            email: email,
                            tenantId: tenantId,
                        },
                    })];
            case 1:
                customer = _b.sent();
                res.status(201).json(customer);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createCustomer = createCustomer;
// READ Customers under Tenant (Only Admin & Manager)
var getCustomers = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var tenantId, customers, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!req.user) {
                    return [2 /*return*/, next(new error_1.AppError("Unauthorized", 401))];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                tenantId = req.tenant.id;
                return [4 /*yield*/, prisma.customer.findMany({
                        where: { tenantId: tenantId },
                    })];
            case 2:
                customers = _a.sent();
                res.json(customers);
                return [2 /*return*/];
            case 3:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getCustomers = getCustomers;
// DELETE Customer Under Tenant (Only Superadmin)
var deleteCustomer = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var tenantId, customerId, customer, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                console.log("Request Params:", req.params); // 🔹 Debugging Step
                tenantId = req.tenant.id;
                customerId = req.params.customerId;
                // 🔹 Ensure customerId is defined
                if (!customerId) {
                    return [2 /*return*/, next(new error_1.AppError("Customer ID is required", 400))];
                }
                // 🔹 Ensure tenantId is defined
                if (!tenantId) {
                    return [2 /*return*/, next(new error_1.AppError("Tenant ID is required", 400))];
                }
                return [4 /*yield*/, prisma.customer.findFirst({
                        where: { id: customerId, tenantId: tenantId }, // ✅ Ensures customer belongs to the correct tenant
                    })];
            case 1:
                customer = _a.sent();
                if (!customer) {
                    return [2 /*return*/, next(new error_1.AppError("Customer not found under this tenant", 404))];
                }
                // Delete the customer
                return [4 /*yield*/, prisma.customer.delete({ where: { id: customerId, tenantId: tenantId } })];
            case 2:
                // Delete the customer
                _a.sent();
                res.json({ message: "Customer deleted successfully" });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                next(error_4);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteCustomer = deleteCustomer;
