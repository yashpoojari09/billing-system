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
exports.deleteInventoryItem = exports.updateInventoryItem = exports.getInventory = exports.createInventoryItem = void 0;
var client_1 = require("@prisma/client");
var error_1 = require("../middlewares/error");
var prisma = new client_1.PrismaClient();
// CREATE Inventory Item (Only Admin & Superadmin)
var createInventoryItem = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var tenantId, _a, name_1, stock, price, newItem, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                if (!req.user) {
                    return [2 /*return*/, next(new error_1.AppError("Unauthorized - User not allowed", 401))];
                }
                tenantId = req.tenant.id;
                if (!tenantId) {
                    return [2 /*return*/, next(new error_1.AppError("Tenant validation failed", 400))];
                }
                _a = req.body, name_1 = _a.name, stock = _a.stock, price = _a.price;
                return [4 /*yield*/, prisma.inventory.create({
                        data: {
                            name: name_1,
                            stock: stock,
                            price: price,
                            tenantId: tenantId, // Ensure it's linked to the correct tenant
                        },
                    })];
            case 1:
                newItem = _b.sent();
                res.status(201).json(newItem);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                console.error("Error creating inventory:", error_2);
                return [2 /*return*/, next(new error_1.AppError("Server error while creating inventory", 500))];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createInventoryItem = createInventoryItem;
// GET All Inventory (Admin & Manager)
var getInventory = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var tenant, items, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!req.user) {
                    return [2 /*return*/, next(new error_1.AppError("Unauthorized - User not allowed", 401))];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                tenant = req.tenant;
                if (!tenant) {
                    return [2 /*return*/, next(new error_1.AppError("Tenant validation failed", 400))];
                }
                return [4 /*yield*/, prisma.inventory.findMany({
                        where: { tenantId: tenant.id },
                    })];
            case 2:
                items = _a.sent();
                res.json(items);
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getInventory = getInventory;
// UPDATE Inventory Item (Admin & Superadmin)
var updateInventoryItem = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var tenant, inventoryId, _a, name_2, stock, price, existingItem, updatedItem, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                if (!req.user) {
                    return [2 /*return*/, next(new error_1.AppError("Unauthorized - User not allowed", 401))];
                }
                tenant = req.tenant;
                if (!tenant) {
                    return [2 /*return*/, next(new error_1.AppError("Tenant validation failed", 400))];
                }
                inventoryId = req.params.inventoryId;
                _a = req.body, name_2 = _a.name, stock = _a.stock, price = _a.price;
                return [4 /*yield*/, prisma.inventory.findUnique({
                        where: { id: inventoryId },
                    })];
            case 1:
                existingItem = _b.sent();
                if (!existingItem) {
                    return [2 /*return*/, next(new error_1.AppError("Inventory item not found", 404))];
                }
                if (existingItem.tenantId !== tenant.id) {
                    return [2 /*return*/, next(new error_1.AppError("Forbidden - Inventory item does not belong to this tenant", 403))];
                }
                return [4 /*yield*/, prisma.inventory.update({
                        where: { id: inventoryId },
                        data: { name: name_2, stock: stock, price: price },
                    })];
            case 2:
                updatedItem = _b.sent();
                res.json(updatedItem);
                return [3 /*break*/, 4];
            case 3:
                error_4 = _b.sent();
                next(error_4);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateInventoryItem = updateInventoryItem;
// DELETE Inventory Item (Only Superadmin)
var deleteInventoryItem = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var tenant, inventoryId, existingItem, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                if (!req.user) {
                    return [2 /*return*/, next(new error_1.AppError("Unauthorized - User not allowed", 401))];
                }
                tenant = req.tenant;
                if (!tenant) {
                    return [2 /*return*/, next(new error_1.AppError("Tenant validation failed", 400))];
                }
                inventoryId = req.params.inventoryId;
                return [4 /*yield*/, prisma.inventory.findUnique({
                        where: { id: inventoryId },
                    })];
            case 1:
                existingItem = _a.sent();
                if (!existingItem) {
                    return [2 /*return*/, next(new error_1.AppError("Inventory item not found", 404))];
                }
                if (existingItem.tenantId !== tenant.id) {
                    return [2 /*return*/, next(new error_1.AppError("Forbidden - Inventory item does not belong to this tenant", 403))];
                }
                // Delete inventory item
                return [4 /*yield*/, prisma.inventory.delete({
                        where: { id: inventoryId },
                    })];
            case 2:
                // Delete inventory item
                _a.sent();
                res.json({ message: "Inventory item deleted successfully" });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                console.error("Error deleting inventory:", error_5);
                return [2 /*return*/, next(new error_1.AppError("Server error while deleting inventory", 500))];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteInventoryItem = deleteInventoryItem;
