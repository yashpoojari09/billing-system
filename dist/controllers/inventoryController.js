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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInventoryItem = exports.updateInventoryItem = exports.getInventory = exports.createInventoryItem = void 0;
const client_1 = require("@prisma/client");
const error_1 = require("../middlewares/error");
const prisma = new client_1.PrismaClient();
// CREATE Inventory Item (Only Admin & Superadmin)
const createInventoryItem = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return next(new error_1.AppError("Unauthorized - User not allowed", 401));
        }
        // Validate Tenant using middleware
        // ✅ Get tenant data from the request (set by validateTenant middleware)
        const { id: tenantId } = req.tenant;
        if (!tenantId) {
            return next(new error_1.AppError("Tenant validation failed", 400));
        }
        const { name, stock, price } = req.body; // Fields for new inventory item
        // Create inventory item linked to the tenant
        const newItem = yield prisma.inventory.create({
            data: {
                name,
                stock,
                price,
                tenantId: tenantId, // Ensure it's linked to the correct tenant
            },
        });
        res.status(201).json(newItem);
    }
    catch (error) {
        console.error("Error creating inventory:", error);
        return next(new error_1.AppError("Server error while creating inventory", 500));
    }
});
exports.createInventoryItem = createInventoryItem;
// GET All Inventory (Admin & Manager)
const getInventory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return next(new error_1.AppError("Unauthorized - User not allowed", 401));
    }
    try {
        // ✅ Get tenant data from the request (set by validateTenant middleware)
        const tenant = req.tenant;
        if (!tenant) {
            return next(new error_1.AppError("Tenant validation failed", 400));
        }
        // Fetch inventory only for the specific tenant
        const items = yield prisma.inventory.findMany({
            where: { tenantId: tenant.id },
        });
        res.json(items);
    }
    catch (error) {
        next(error);
    }
});
exports.getInventory = getInventory;
// UPDATE Inventory Item (Admin & Superadmin)
const updateInventoryItem = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return next(new error_1.AppError("Unauthorized - User not allowed", 401));
        }
        // Validate Tenant using middleware
        const tenant = req.tenant;
        if (!tenant) {
            return next(new error_1.AppError("Tenant validation failed", 400));
        }
        const { inventoryId } = req.params; // Get inventory item ID from params
        const { name, stock, price } = req.body; // Fields to update
        // Check if inventory item exists and belongs to the correct tenant
        const existingItem = yield prisma.inventory.findUnique({
            where: { id: inventoryId },
        });
        if (!existingItem) {
            return next(new error_1.AppError("Inventory item not found", 404));
        }
        if (existingItem.tenantId !== tenant.id) {
            return next(new error_1.AppError("Forbidden - Inventory item does not belong to this tenant", 403));
        }
        // Update inventory item
        const updatedItem = yield prisma.inventory.update({
            where: { id: inventoryId },
            data: { name, stock, price },
        });
        res.json(updatedItem);
    }
    catch (error) {
        next(error);
    }
});
exports.updateInventoryItem = updateInventoryItem;
// DELETE Inventory Item (Only Superadmin)
const deleteInventoryItem = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return next(new error_1.AppError("Unauthorized - User not allowed", 401));
        }
        // Validate Tenant using middleware
        const tenant = req.tenant;
        if (!tenant) {
            return next(new error_1.AppError("Tenant validation failed", 400));
        }
        const { inventoryId } = req.params; // Get inventory item ID from params
        // Check if inventory item exists and belongs to the correct tenant
        const existingItem = yield prisma.inventory.findUnique({
            where: { id: inventoryId },
        });
        if (!existingItem) {
            return next(new error_1.AppError("Inventory item not found", 404));
        }
        if (existingItem.tenantId !== tenant.id) {
            return next(new error_1.AppError("Forbidden - Inventory item does not belong to this tenant", 403));
        }
        // Delete inventory item
        yield prisma.inventory.delete({
            where: { id: inventoryId },
        });
        res.json({ message: "Inventory item deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting inventory:", error);
        return next(new error_1.AppError("Server error while deleting inventory", 500));
    }
});
exports.deleteInventoryItem = deleteInventoryItem;
//# sourceMappingURL=inventoryController.js.map